import { formatIsoToBR } from "../formatters/isoDate";
import { logoSrc } from "./base64image";

function formatDateBR(dateInput: string | Date) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function reportTemplate(relatorio: any) {
  let text = relatorio.relatorio || "";
  let resumo = typeof relatorio.resumo === 'string' ? JSON.parse(relatorio.resumo) : (relatorio.resumo || {});

  // Processamento de texto (Markdown para HTML)
  text = text.replace(/\\n/g, "\n")
             .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
             .replace(/^\s*\*\s+/gm, "• ")
             .replace(/\n{2,}/g, "</p><p>")
             .replace(/\n/g, "<br>");

return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

    body {
      font-family: 'Inter', sans-serif;
      padding: 0;
      margin: 0;
      color: #1a1a1a;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
    }

    .page { padding: 40px; }

    /* Header com Identidade Visual */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 4px solid #4b2a59; /* Brand Purple */
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .logo { width: 140px; }
    
    .header-info { text-align: right; }
    .header-info h1 { 
      margin: 0; 
      font-size: 22px; 
      font-weight: 800; 
      color: #4b2a59;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }

    /* Cards de Informação Geral */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    .info-card {
      background: #fdfbff;
      border: 1px solid #f0e6f5;
      padding: 15px;
      border-radius: 16px;
    }

    .info-label {
      font-size: 10px;
      font-weight: 800;
      color: #a084ad;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 4px;
    }

    .info-value { font-size: 13px; font-weight: 600; color: #333; }

    /* Stats Grid Moderno */
    .stats-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 40px;
    }

    .stat-box {
      padding: 20px;
      border-radius: 24px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .stat-avg { background: #f7f3f9; border: 1px solid #e9dff0; }
    .stat-min { background: #eff6ff; border: 1px solid #dbeafe; }
    .stat-max { background: #fff1f2; border: 1px solid #ffe4e6; }

    .stat-label { font-size: 11px; font-weight: 700; color: #666; display: block; margin-bottom: 8px; }
    .stat-val { font-size: 28px; font-weight: 800; }
    .stat-avg .stat-val { color: #4b2a59; }
    .stat-min .stat-val { color: #2563eb; }
    .stat-max .stat-val { color: #e11d48; }

    /* Seção de Texto */
    h2 {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4b2a59;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h2::after { content: ""; flex: 1; height: 1px; background: #eee; }

    .report-content {
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 20px;
      padding: 25px;
      font-size: 13px;
      color: #444;
      text-align: justify;
      margin-bottom: 30px;
    }

    /* Tabela Clean */
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { text-align: left; font-size: 11px; color: #999; padding: 10px; border-bottom: 1px solid #eee; }
    td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #f9f9f9; font-weight: 600; }

    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 10px;
      color: #aaa;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>

<body>
  <div class="page">
    <div class="header">
      <img class="logo" src="${logoSrc}" alt="Logo SafeTemp" />
      <div class="header-info">
        <h1>Relatório Técnico</h1>
        <div style="font-size: 11px; color: #a084ad; font-weight: 600;">Sistema SafeTemp • 2026</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <span class="info-label">Identificação</span>
        <div class="info-value">Dispositivo (Chip ID): ${relatorio.chip_id}</div>
        <div class="info-value" style="font-size: 11px; color: #999;">ID Relatório: #${relatorio.id}</div>
        <div class="info-value" style="font-size: 11px; color: #999;">Gerado em: ${formatIsoToBR(relatorio.criado_em)}</div>
      </div>
      <div class="info-card">
        <span class="info-label">Período de Análise</span>
        <div class="info-value">${formatIsoToBR(resumo.intervalo)}</div>
      </div>
    </div>

    <h2>Resumo Estatístico</h2>
    <div class="stats-container">
      <div class="stat-box stat-avg">
        <span class="stat-label">Média Geral</span>
        <div class="stat-val">${resumo.media.toFixed(2)}°C</div>
      </div>
      <div class="stat-box stat-min">
        <span class="stat-label">Mínima</span>
        <div class="stat-val">${resumo.min.toFixed(2)}°C</div>
      </div>
      <div class="stat-box stat-max">
        <span class="stat-label">Máxima</span>
        <div class="stat-val">${resumo.max.toFixed(2)}°C</div>
      </div>
    </div>

    <h2>Análise Processada por IA</h2>
    <div class="report-content">
      <p>${text}</p>
    </div>

    <h2>Dados de Integridade</h2>
    <table>
      <thead>
        <tr>
          <th>Métrica de Coleta</th>
          <th>Resultado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Amostras Processadas</td>
          <td>${resumo.registros} registros</td>
        </tr>
        <tr>
          <td>Desvio Padrão</td>
          <td>${resumo.std.toFixed(3)} °C</td>
        </tr>
        <tr>
          <td>Outliers (Anomalias)</td>
          <td style="color: ${resumo.totalOutliers > 0 ? '#e11d48' : '#10b981'}">
            ${resumo.totalOutliers} detectados
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      Este documento é uma análise automática gerada pelo SafeTemp via Microsoft Azure.<br>
      Autenticidade garantida por Chip ID: ${relatorio.chip_id} • Gerado em: ${formatDateBR(new Date())}
    </div>
  </div>
</body>
</html>`;
}