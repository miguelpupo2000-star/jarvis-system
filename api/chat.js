// api/chat.js (Código mestre definitivo com fluxo de dados HTTPS nativo para Vercel)
const https = require('https');

module.exports = async (req, res) => {
  // Configuração obrigatória de liberação de CORS
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
      return res.status(401).json({ resposta: "[SISTEMA]: A variável GROQ_API_KEY não foi encontrada na Vercel." });
    }

    API_KEY = API_KEY.trim().replace(/['"]+/g, '');

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português de forma concisa.";

    // Monta o pacote de envio exigido pelos servidores da Groq
    const dadosCorpo = JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: instrucaoSistema },
        { role: "user", content: mensagem }
      ],
      temperature: 0.7
    });

    // Configurações do cabeçalho da transmissão de rede pura
    const opcoes = {
      hostname: '://groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(dadosCorpo)
      }
    };

    // Abre o fluxo contínuo que impede o erro de pacote de dados vazio
    const requisicao = https.request(opcoes, (respostaServidor) => {
      let dadosRecebidos = '';

      // Junta cada pedaço de texto à medida que ele chega do servidor da Groq
      respostaServidor.on('data', (pedaco) => {
        dadosRecebidos += pedaco;
      });

      // Quando a transmissão termina por completo, ele compila o resultado final
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

          return res.status(200).json({ resposta: `[SISTEMA]: Formato inesperado recebido: ${dadosRecebidos}` });

        } catch (erroJson) {
          return res.status(500).json({ resposta: `[SISTEMA]: Erro ao compilar pacote. Dados recebidos: ${dadosRecebidos}` });
        }
      });
    });

    requisicao.on('error', (erroRede) => {
      return res.status(500).json({ resposta: `[SISTEMA]: Erro físico na transmissão de rede: ${erroRede.message}` });
    });

    // Envia o payload bruto e fecha o canal de transmissão
    requisicao.write(dadosCorpo);
    requisicao.end();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ resposta: `[ERRO CRÍTICO]: Falha interna no servidor: ${error.message}` });
  }
};
