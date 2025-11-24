export function formatIsoToBR(interval: string) {
  if (!interval || !interval.includes("→")) return "—";

  const [startIso, endIso] = interval.split("→").map(s => s.trim());

  const formatOne = (iso: string) => {
    const date = new Date(iso);

    const day = date.getUTCDate().toString().padStart(2, "0");
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = date.getUTCFullYear();

    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return `${formatOne(startIso)} → ${formatOne(endIso)}`;
};
