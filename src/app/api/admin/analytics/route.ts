import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserActivity from "@/models/UserActivity";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import { INITIAL_GROUPS } from "@/data/initialData";
import { predictWorldCupMatch } from "@/utils/poissonMatchPrediction";

function isAdminEmail(email: string | null) {
  const adminEmails = ["mailjmq@gmail.com"];
  return email && adminEmails.includes(email);
}

export async function GET(request: Request) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);

    const { searchParams } = new URL(request.url);
    const includeAdmins = searchParams.get("includeAdmins") === "true";

    // ── Get excluded user UIDs ──────────────────────────────────────────────
    const queryConditions: any[] = [{ excludeFromStats: true }];
    if (!includeAdmins) {
      queryConditions.push({ role: "admin" });
    }

    const excludedUsers = await User.find({
      $or: queryConditions
    }).select("firebaseUid").lean();
    const excludedUids = excludedUsers.map((u) => u.firebaseUid);

    // ── Summary KPIs ──────────────────────────────────────────────────────────
    const [
      totalUsers,
      newUsersToday,
      activeToday,
      activeThisWeek,
      totalPredictions,
    ] = await Promise.all([
      User.countDocuments({ firebaseUid: { $nin: excludedUids } }),
      User.countDocuments({ createdAt: { $gte: todayStart }, firebaseUid: { $nin: excludedUids } }),
      User.countDocuments({ lastActiveAt: { $gte: todayStart }, firebaseUid: { $nin: excludedUids } }),
      User.countDocuments({ lastActiveAt: { $gte: last7Days }, firebaseUid: { $nin: excludedUids } }),
      ProdePrediction.countDocuments({ firebaseUid: { $nin: excludedUids } }),
    ]);

    // ── Daily registrations (last 30 days) ───────────────────────────────────
    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: last30Days }, firebaseUid: { $nin: excludedUids } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Daily active users (last 30 days) ─────────────────────────────────────
    const dailyActiveUsers = await User.aggregate([
      { $match: { lastActiveAt: { $gte: last30Days }, firebaseUid: { $nin: excludedUids } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$lastActiveAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Activity by action type (last 30 days) ────────────────────────────────
    const activityByType = await UserActivity.aggregate([
      { $match: { createdAt: { $gte: last30Days }, firebaseUid: { $nin: excludedUids } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $project: { action: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // ── Daily login events (last 30 days) ─────────────────────────────────────
    const dailyLogins = await UserActivity.aggregate([
      { $match: { action: "LOGIN", createdAt: { $gte: last30Days }, firebaseUid: { $nin: excludedUids } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Top pages viewed ──────────────────────────────────────────────────────
    const topPages = await UserActivity.aggregate([
      { $match: { action: "PAGE_VIEW", createdAt: { $gte: last30Days }, firebaseUid: { $nin: excludedUids } } },
      { $group: { _id: "$metadata.path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { path: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Users by country ─────────────────────────────────────────────────────
    const usersByCountry = await User.aggregate([
      { $match: { country: { $exists: true, $ne: null }, firebaseUid: { $nin: excludedUids } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { country: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Users by favorite team ────────────────────────────────────────────────
    const usersByFavoriteTeam = await User.aggregate([
      { $match: { favoriteTeam: { $exists: true, $ne: null }, firebaseUid: { $nin: excludedUids } } },
      { $group: { _id: "$favoriteTeam", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { team: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Accuracy Comparison (Model vs Users) ─────────────────────────────────
    const finishedMatches = await LiveScore.find({ status: "finished" }).lean();
    
    const allTeams = INITIAL_GROUPS.flatMap((g: any) => g.teams);
    const teamMap = new Map<string, any>();
    for (const t of allTeams) {
      teamMap.set(t.name, t);
    }
    
    // Map match ID to its group stage matchday (1, 2, or 3)
    const matchLookup = new Map<string, { stage: string; matchday?: number }>();
    for (const group of INITIAL_GROUPS) {
      group.matches.forEach((match: any, i: number) => {
        const matchday = Math.floor(i / 2) + 1;
        matchLookup.set(match.id, {
          stage: "group",
          matchday,
        });
      });
    }
    
    const finishedMatchIds = finishedMatches.map((m) => m.matchId);
    const userPredictionsForFinished = await ProdePrediction.find({
      matchId: { $in: finishedMatchIds },
      firebaseUid: { $nin: excludedUids }
    }).lean();
    
    const predictionsByMatch = new Map<string, any[]>();
    for (const p of userPredictionsForFinished) {
      if (!predictionsByMatch.has(p.matchId)) {
        predictionsByMatch.set(p.matchId, []);
      }
      predictionsByMatch.get(p.matchId)!.push(p);
    }

    let totalFinishedMatches = finishedMatches.length;
    let totalUserPredictionsCount = userPredictionsForFinished.length;

    let modelCorrectOutcomes = 0;
    let modelCorrectScores = 0;
    let usersCorrectOutcomes = 0;
    let usersCorrectScores = 0;

    const getStageLabel = (match: any) => {
      if (match.stage === "group") {
        const info = matchLookup.get(match.matchId);
        if (info && info.matchday) {
          return `Fase de Grupos - Fecha ${info.matchday}`;
        }
        return "Fase de Grupos";
      }
      const idNum = Number(match.matchId);
      if (isNaN(idNum)) return "Eliminatorias";
      if (idNum >= 73 && idNum <= 88) return "16avos de Final";
      if (idNum >= 89 && idNum <= 96) return "8vos de Final";
      if (idNum >= 97 && idNum <= 100) return "Cuartos de Final";
      if (idNum >= 101 && idNum <= 102) return "Semifinales";
      return "Final / 3er Puesto";
    };

    const stageMap = new Map<string, {
      stageName: string;
      totalMatches: number;
      totalUserPreds: number;
      modelCorrectOutcomes: number;
      modelCorrectScores: number;
      usersCorrectOutcomes: number;
      usersCorrectScores: number;
    }>();

    for (const match of finishedMatches) {
      const teamA = teamMap.get(match.homeTeamName);
      const teamB = teamMap.get(match.awayTeamName);
      
      const pointsA = teamA?.fifaPoints ?? 1500;
      const pointsB = teamB?.fifaPoints ?? 1500;
      const esAnfitrionA = teamA?.name === "México" || teamA?.name === "Canadá" || teamA?.name === "Estados Unidos";
      const esAnfitrionB = teamB?.name === "México" || teamB?.name === "Canadá" || teamB?.name === "Estados Unidos";
      
      const isKnockout = match.stage === "knockout";
      
      const predictionDetails = predictWorldCupMatch({
        puntosA: pointsA,
        puntosB: pointsB,
        es_anfitrionA: esAnfitrionA,
        es_anfitrionB: esAnfitrionB,
        es_eliminacion_directa: isKnockout,
      });

      const best = predictionDetails.marcadorMasProbable;
      const modelOutcome = best.golesA > best.golesB ? "home" : best.golesA < best.golesB ? "away" : "draw";
      
      if (match.homeScore === null || match.awayScore === null) continue;
      const actualOutcome = match.homeScore > match.awayScore ? "home" : match.homeScore < match.awayScore ? "away" : "draw";

      const isModelOutcomeCorrect = modelOutcome === actualOutcome;
      const isModelScoreCorrect = best.golesA === match.homeScore && best.golesB === match.awayScore;

      if (isModelOutcomeCorrect) modelCorrectOutcomes++;
      if (isModelScoreCorrect) modelCorrectScores++;

      const preds = predictionsByMatch.get(match.matchId) || [];
      let matchUserCorrectOutcomes = 0;
      let matchUserCorrectScores = 0;

      for (const p of preds) {
        const userOutcome = p.homeScore > p.awayScore ? "home" : p.homeScore < p.awayScore ? "away" : "draw";
        if (userOutcome === actualOutcome) {
          matchUserCorrectOutcomes++;
          usersCorrectOutcomes++;
        }
        if (p.homeScore === match.homeScore && p.awayScore === match.awayScore) {
          matchUserCorrectScores++;
          usersCorrectScores++;
        }
      }

      // Stage aggregation
      const stageKey = getStageLabel(match);
      if (!stageMap.has(stageKey)) {
        stageMap.set(stageKey, {
          stageName: stageKey,
          totalMatches: 0,
          totalUserPreds: 0,
          modelCorrectOutcomes: 0,
          modelCorrectScores: 0,
          usersCorrectOutcomes: 0,
          usersCorrectScores: 0,
        });
      }

      const stageStat = stageMap.get(stageKey)!;
      stageStat.totalMatches++;
      stageStat.totalUserPreds += preds.length;
      if (isModelOutcomeCorrect) stageStat.modelCorrectOutcomes++;
      if (isModelScoreCorrect) stageStat.modelCorrectScores++;
      stageStat.usersCorrectOutcomes += matchUserCorrectOutcomes;
      stageStat.usersCorrectScores += matchUserCorrectScores;
    }

    const accuracyByStage = Array.from(stageMap.values()).map(s => ({
      stageName: s.stageName,
      totalMatches: s.totalMatches,
      modelOutcomeAcc: s.totalMatches > 0 ? (s.modelCorrectOutcomes / s.totalMatches) * 100 : 0,
      modelScoreAcc: s.totalMatches > 0 ? (s.modelCorrectScores / s.totalMatches) * 100 : 0,
      usersOutcomeAcc: s.totalUserPreds > 0 ? (s.usersCorrectOutcomes / s.totalUserPreds) * 100 : 0,
      usersScoreAcc: s.totalUserPreds > 0 ? (s.usersCorrectScores / s.totalUserPreds) * 100 : 0,
    }));

    const stageOrder = [
      "Fase de Grupos - Fecha 1",
      "Fase de Grupos - Fecha 2",
      "Fase de Grupos - Fecha 3",
      "16avos de Final",
      "8vos de Final",
      "Cuartos de Final",
      "Semifinales",
      "Final / 3er Puesto"
    ];

    accuracyByStage.sort((a, b) => {
      const idxA = stageOrder.indexOf(a.stageName);
      const idxB = stageOrder.indexOf(b.stageName);
      if (idxA === -1 && idxB === -1) return a.stageName.localeCompare(b.stageName);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    const accuracyData = {
      summary: {
        totalFinishedMatches,
        totalUserPredictions: totalUserPredictionsCount,
        model: {
          outcomeAccuracy: totalFinishedMatches > 0 ? (modelCorrectOutcomes / totalFinishedMatches) * 100 : 0,
          scoreAccuracy: totalFinishedMatches > 0 ? (modelCorrectScores / totalFinishedMatches) * 100 : 0,
          correctOutcomes: modelCorrectOutcomes,
          correctScores: modelCorrectScores,
        },
        users: {
          outcomeAccuracy: totalUserPredictionsCount > 0 ? (usersCorrectOutcomes / totalUserPredictionsCount) * 100 : 0,
          scoreAccuracy: totalUserPredictionsCount > 0 ? (usersCorrectScores / totalUserPredictionsCount) * 100 : 0,
          correctOutcomes: usersCorrectOutcomes,
          correctScores: usersCorrectScores,
        }
      },
      byStage: accuracyByStage
    };

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalUsers,
          newUsersToday,
          activeToday,
          activeThisWeek,
          totalPredictions,
        },
        charts: {
          dailyRegistrations,
          dailyActiveUsers,
          dailyLogins,
          activityByType,
          topPages,
          usersByCountry,
          usersByFavoriteTeam,
        },
        accuracy: accuracyData,
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
