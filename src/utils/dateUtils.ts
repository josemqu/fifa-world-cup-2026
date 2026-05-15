/**
 * Formats a match date and time from a UTC ISO string to local browser time.
 * Input format: ISO 8601 UTC string
 */
export function getLocalDateAndTime(utcDateStr: string): { date: string; time: string } {
  if (!utcDateStr) return { date: "", time: "" };

  try {
    const utcDate = new Date(utcDateStr);

    // Format date as "11 Jun" (localized)
    const formattedDate = utcDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });

    // Format time as HH:mm
    const formattedTime = utcDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return {
      date: formattedDate,
      time: formattedTime,
    };
  } catch (error) {
    console.error("Error formatting match date/time:", error);
    return { date: "", time: "" };
  }
}
