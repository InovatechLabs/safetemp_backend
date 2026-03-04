export function formatIsoToBR(interval: any) {

  if (!interval) return "—";

  const dateStr = interval instanceof Date ? interval.toISOString() : String(interval);

  const formatOne = (iso: string) => {
    const date = new Date(iso);

    if (isNaN(date.getTime())) return "Data Inválida";

    return date.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(',', '');
  };

  if (dateStr.includes("→")) {
    const [startIso, endIso] = dateStr.split("→").map(s => s.trim());
    return `${formatOne(startIso)} → ${formatOne(endIso)}`;
  }

  return formatOne(dateStr);
}