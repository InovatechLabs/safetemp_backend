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
  let resumo = relatorio.resumo;

  if (typeof resumo === 'string') {
    try {
        resumo = JSON.parse(resumo);
    } catch (e) {
        console.error("Erro ao parsear string:", e);
        resumo = {};
    }
  }
  resumo = resumo || {};
  // 1. Normaliza as quebras de linha literais (\\n) para caracteres reais (\n)
  
  text = text.replace(/\\n/g, "\n");

  // 2. Sanitiza texto para não quebrar HTML 
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 3. Converte listas (Markdown simples: * Item)
  // O 'gm' é importante: global + multiline (para o ^ pegar inicio da linha)
  text = text.replace(/^\s*\*\s+/gm, "• ");

  // 4. Converte parágrafos duplos (\n\n viram novos parágrafos)
  text = text.replace(/\n{2,}/g, "</p><p class='mb-4'>");

  // 5. Converte quebras de linha restantes (\n viram <br>)
  text = text.replace(/\n/g, "<br>");

  // 6. Envolve tudo na tag inicial
  text = `<p>${text}</p>`;

  return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
      font-size: 14px;
      -webkit-print-color-adjust: exact; /* Garante cores ao imprimir/gerar PDF */
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 20px;
    }

    .logo {
      width: 200px;
      margin-bottom: 15px;
    }

    h1 {
      font-size: 24px;
      color: #2c3e50;
      margin: 0;
      font-weight: 700;
    }

    h2 {
      margin-top: 15px;
      font-size: 18px;
      border-left: 4px solid #4b9cd3;
      padding-left: 12px;
      color: #2c3e50;
      font-weight: 600;
    }

    .card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e9ecef;
      font-size: 13px;
      display: grid;
      grid-template-columns: 1fr 1fr; /* Divide info em duas colunas */
      gap: 10px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }

    .stat-item {
      background: #fff;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #dfe6ed;
      text-align: center;
    }

    .stat-item strong {
      display: block;
      color: #6c757d;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }

    .report-text {
      background: #fff;
      padding: 10px 0;
      color: #444;
      text-align: justify;
      /* white-space: pre-wrap é uma "rede de segurança".
         Ele garante que se sobrar algum \n real, o HTML quebra a linha.
      */
      white-space: pre-wrap; 
    }

    .report-text p {
      margin-bottom: 15px;
      margin-top: 0px; /* Espaçamento entre parágrafos */
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 13px;
    }

    table th {
      background: #f1f3f5;
      color: #495057;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }

    table td {
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
    }

    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 11px;
      color: #9fa3a7ff;
    }
  </style>
</head>

<body>

  <div class="header">
    <img class="logo" src="${logoSrc}" alt="Logo SafeTemp" />
    <h1>Relatório de Temperatura</h1>
    <p style="color: #777; margin-top: 5px;">Sistema de Monitoramento SafeTemp</p>
  </div>

  <h2>Informações Gerais</h2>
  <div class="card">
    <div><strong>ID Relatório:</strong> ${relatorio.id}</div>
    <div><strong>Chip ID:</strong> ${relatorio.chip_id}</div>
    <div><strong>Gerado em:</strong> ${formatDateBR(relatorio.criado_em)}</div>
    <div><strong>Intervalo:</strong> ${formatIsoToBR(resumo.intervalo) ?? "—"}</div>
  </div>

  <h2>Resumo Estatístico</h2>
  <div class="stats">
    <div class="stat-item">
      <strong>Média Geral</strong>
      <div class="stat-value">${resumo.media.toFixed(2) ?? "—"}°C</div>
    </div>
    <div class="stat-item">
      <strong>Mínima Absoluta</strong>
      <div class="stat-value" style="color: #2980b9;">${resumo.min.toFixed(2) ?? "—"}°C</div>
    </div>
    <div class="stat-item">
      <strong>Máxima Absoluta</strong>
      <div class="stat-value" style="color: #c0392b;">${resumo.max.toFixed(2) ?? "—"}°C</div>
    </div>
  </div>

  <h2>Análise Detalhada</h2>
  <div class="report-text">
    ${text}
  </div>

  <h2>Metadados da Coleta</h2>
  <table>
    <thead>
      <tr>
        <th width="40%">Métrica</th>
        <th>Valor Apurado</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Registros Processados</td>
        <td>${resumo.registros ?? "—"} amostras</td>
      </tr>
      <tr>
        <td>Outliers Identificados</td>
        <td>${resumo.totalOutliers ?? "0"} ocorrências</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    PDF gerado pelo sistema SafeTemp. <br>
    Data de geração: ${formatDateBR(new Date())} 
  </div>

</body>
</html>`;
}