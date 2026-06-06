// api/chat.js (Sintaxe pura nativa do Node.js para servidores Vercel)
const https = require('https');

module.exports = async (req, res) => {
  // Libera as permissões de acesso contra travas de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { mensagem } = req.body;
    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return res.status(401).json({ resposta: "[SISTEMA]: Variável GROQ_API_KEY não localizada no servidor." });
    }

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português de forma clara e concisa.";

    // Dados que vamos enviar estruturados para a Groq Cloud
    const dadosCorpo = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: instrucaoSistema },
        { role: "user", content: mensagem }
      ],
      temperature: 0.7
    });

    // Configurações de cabeçalho da requisição segura para o servidor da Groq
    const opcoes = {
      hostname: '://groq.com',
      port: 4443 || 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY.trim()}`,
        'Content-Length': Buffer.byteLength(dadosCorpo)
      }
    };

    // Cria o túnel de comunicação via módulo HTTPS nativo do Node
    const requisicao = https.request(opcoes, (respostaServidor) => {
      let dadosRecebidos = '';

      respostaServidor.on('data', (pedaco) => {
        dadosRecebidos += pedaco;
      });

      respostaServidor.on('end', () => {
        try {
          const dadosJSON = JSON.parse(dadosRecebidos);

          if (dadosJSON.error) {
            return res.status(400).json({ resposta: `[GROQ ERROR]: ${dadosJSON.error.message}` });
          }

          const respostaTexto = dadosJSON.choices[0].message.content;
          return res.status(200).json({ resposta: respostaTexto });

        } catch (erroJson) {
          return res.status(500).json({ resposta: "[SISTEMA]: Falha na compilação do pacote de resposta." });
        }
      });
    });

    requisicao.on('error', (erroRede) => {
      return res.status(500).json({ resposta: "[SISTEMA]: Erro de conexão no barramento com a Groq." });
    });

    // Escreve os dados e fecha a transmissão
    requisicao.write(dadosCorpo);
    requisicao.end();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ resposta: "[SISTEMA]: Falha crítica no processamento da requisição." });
  }
};
