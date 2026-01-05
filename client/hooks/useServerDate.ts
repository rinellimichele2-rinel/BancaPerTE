import { useQuery } from "@tanstack/react-query";

interface ServerDateResponse {
  date: string;
  timestamp: number;
  timezone: string;
}

export function useServerDate() {
  return useQuery<ServerDateResponse>({
    queryKey: ["/api/server-date"],
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function formatServerDate(
  isoDate: string,
  format: "short" | "long" | "full" = "short",
): string {
  const date = new Date(isoDate);

  switch (format) {
    case "full":
      return date.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "long":
      return date.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "short":
    default:
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
  }
}

export function isToday(isoDate: string, serverDate: string): boolean {
  const transactionDate = new Date(isoDate).toDateString();
  const currentDate = new Date(serverDate).toDateString();
  return transactionDate === currentDate;
}

export function isThisMonth(isoDate: string, serverDate: string): boolean {
  const transaction = new Date(isoDate);
  const current = new Date(serverDate);
  return (
    transaction.getMonth() === current.getMonth() &&
    transaction.getFullYear() === current.getFullYear()
  );
}
