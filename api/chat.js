// api/chat.js (Sintaxe clássica estável para servidores Vercel)
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
    
    // Puxa a chave gsk_ cadastrada no painel da Vercel
    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return res.status(401).json({ resposta: "[SISTEMA]: Variável GROQ_API_KEY não localizada no servidor." });
    }

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português de forma clara.";

    // Faz a chamada segura para a Groq Cloud usando o modelo Llama 3.3 estável
    const respostaGroq = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY.trim()}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [
          { role: "system", content: instrucaoSistema },
          { role: "user", content: mensagem }
        ],
        temperature: 0.7
      })
    });

    const dadosJSON = await respostaGroq.json();

    if (dadosJSON.error) {
      return res.status(400).json({ resposta: `[GROQ ERROR]: ${dadosJSON.error.message}` });
    }

    const respostaTexto = dadosJSON.choices[0].message.content;

    // Retorna a resposta final gerada pela IA de volta para o site
    return res.status(200).json({ resposta: respostaTexto });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ resposta: "[SISTEMA]: Falha crítica no processamento da requisição." });
  }
};
