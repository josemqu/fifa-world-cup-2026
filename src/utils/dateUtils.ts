/**
 * Formats a match date and time from UTC strings to local browser time.
 * Input format: date "DD/MM", time "HH:mm"
 * Assumes year 2026 for the FIFA World Cup.
 */
export function getLocalDateAndTime(dateStr: string, timeStr: string): { date: string; time: string } {
  if (!dateStr || !timeStr) return { date: dateStr, time: timeStr };

  try {
    const [day, month] = dateStr.split("/").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);

    // Create a Date object in UTC
    // Month is 0-indexed in JS Date
    const utcDate = new Date(Date.UTC(2026, month - 1, day, hours, minutes));

    // Format date as DD/MM
    const localDay = utcDate.getDate().toString().padStart(2, "0");
    const localMonth = (utcDate.getMonth() + 1).toString().padStart(2, "0");
    const formattedDate = `${localDay}/${localMonth}`;

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
    return { date: dateStr, time: timeStr };
  }
}
