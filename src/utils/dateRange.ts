export function getDayRange(customDate?: Date) {
    let startOfDay: Date;

    if (customDate) {
        // MODO 1: Data Específica (Vindo da busca por data)
        // O new Date("YYYY-MM-DD") gera 00:00 UTC.
        // O dia no Brasil começa às 03:00 UTC.
        // Então pegamos a data recebida e forçamos para 03:00.
        startOfDay = new Date(customDate);
        startOfDay.setUTCHours(3, 0, 0, 0);
        
        // Correção de segurança: Caso o input já tenha vindo com hora (ex: UTC-3 implícito), 
        // isso garante que estamos falando da manhã desse dia em UTC.
    } else {
        // MODO 2: "Hoje" (Automático / Sem parâmetro)
        // Pega o agora (UTC), subtrai 3h para alinhar com o dia do Brasil.
        // Ex: 02:00 UTC (dia 23) - 3h = 23:00 BRT (dia 22).
        const now = new Date();
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        
        // Zera para meia-noite "virtual" e soma 3h para voltar ao UTC do banco
        brazilTime.setUTCHours(0, 0, 0, 0);
        startOfDay = new Date(brazilTime.getTime() + (3 * 60 * 60 * 1000));
    }

    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000));

    return { startOfDay, endOfDay };
};

export function buildDayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end   = new Date(`${dateStr}T23:59:59.999Z`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  return { start, end };
}