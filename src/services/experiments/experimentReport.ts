import axios from 'axios';

export const generateExperimentReport = async (experimentData: any, records: any[]) => {
  console.log("--- INICIANDO CHAMADA IA ---");
  
  try {
    const url = `${process.env.EXPERIMENTS_AI_URL}/gerar-laudo-experimento`.replace(/\/+/g, '/').replace(':/', '://');
    console.log("URL Destino:", url);

    if (!records || records.length === 0) {
      console.log("AVISO: Array de records está vazio!");
    }

    const response = await axios.post(url, {
      records: records.map(r => ({ value: r.value, timestamp: r.timestamp })),
      metadata: {
        nome: experimentData.nome,
        objetivo: experimentData.objetivo,
        min: experimentData.temp_min_ideal,
        max: experimentData.temp_max_ideal
      }
    }, { timeout: 30000 });

    console.log("STATUS RESPOSTA:", response.status);
    console.log("DATA RECEBIDO:", response.data);

    return response.data?.laudo || "Laudo não encontrado no JSON de resposta.";

  } catch (error: any) {
    console.log("--- ERRO DENTRO DO SERVICE ---");
    if (error.response) {
      console.log("Erro Data:", error.response.data);
      console.log("Erro Status:", error.response.status);
    } else {
      console.log("Mensagem de Erro:", error.message);
    }
    return "Falha na comunicação com o serviço de IA.";
  }
};