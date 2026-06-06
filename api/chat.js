// api/chat.js (Configuração precisa de DNS e barramento estável para a Groq na Vercel)
const https = require('https');

module.exports = async (req, res) => {
  // Libera as permissões de acesso contra travas de CORS do navegador
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { mensagem } = req.body;
    let API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return res.status(401).json({ resposta: "[SISTEMA]: A variável GROQ_API_KEY não foi encontrada nas configurações da Vercel." });
    }

    // Limpa qualquer aspa ou espaço invisível que possa ter vindo na colagem
    API_KEY = API_KEY.trim().replace(/['"]+/g, '');

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português.";

    const dadosCorpo = JSON.stringify({
      model: "llama3-8b-8192", // Modelo estável de altíssima velocidade da Groq
      messages: [
        { role: "system", content: instrucaoSistema },
        { role: "user", content: mensagem }
      ],
      temperature: 0.7
    });

    // 🎯 PROTOCOLO DE CONEXÃO CORRIGIDO: Endereços separados sem misturar protocolos
    const opcoes = {
      hostname: '://groq.com',          // Apenas o domínio limpo para o DNS localizar
      port: 443,                         // Porta HTTPS estável padrão
      path: '/openai/v1/chat/completions', // O caminho completo da rota da API
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(dadosCorpo)
      }
    };

    // Abre o fluxo contínuo de transmissão
    const requisicao = https.request(opcoes, (respostaServidor) => {
      let dadosRecebidos = '';

      respostaServidor.on('data', (pedaco) => {
        dadosRecebidos += pedaco;
      });

      respostaServidor.on('end', () => {
        try {
          const dadosJSON = JSON.parse(dadosRecebidos);

          if (dadosJSON.error) {
            return res.status(400).json({ resposta: `[GROQ API ERROR]: ${dadosJSON.error.message}` });
          }

          if (dadosJSON.choices && dadosJSON.choices[0] && dadosJSON.choices[0].message) {
            const respostaTexto = dadosJSON.choices[0].message.content;
            return res.status(200).json({ resposta: respostaTexto });
          }

          return res.status(200).json({ resposta: "[SISTEMA]: Formato inesperado de dados retornado pela Groq." });

        } catch (erroJson) {
          return res.status(500).json({ resposta: `[SISTEMA]: Erro ao compilar pacote. Dados brutos: ${dadosRecebidos}` });
        }
      });
    });

    requisicao.on('error', (erroRede) => {
      return res.status(500).json({ resposta: `[SISTEMA]: Erro físico na transmissão de rede: ${erroRede.message}` });
    });

    // Transmite o payload e encerra a conexão
    requisicao.write(dadosCorpo);
    requisicao.end();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ resposta: `[ERRO CRÍTICO]: Falha interna no processamento: ${error.message}` });
  }
};
