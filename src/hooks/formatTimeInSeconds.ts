export function formatTimeInSeconds(timeInSeconds: number) {
    return {
      minutes: Math.floor(timeInSeconds / 60),
      seconds: String(timeInSeconds % 60).padStart(2, "0"),
    };
  }
  