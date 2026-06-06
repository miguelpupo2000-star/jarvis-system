// api/chat.js (Versão definitiva usando Fetch Server nativo da Vercel)
export default async function handler(req, res) {
  // Configuração rigorosa de liberação de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ resposta: "Método inválido" });
  }

  try {
    const { mensagem } = req.body;
    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return res.status(401).json({ resposta: "[SISTEMA]: Variável GROQ_API_KEY não localizada no servidor." });
    }

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português de forma clara.";

    // Disparando via fetch global do ecossistema moderno da Vercel
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

    // Leitura correta do formato de resposta estruturado
    const respostaTexto = dadosJSON.choices[0].message.content;

    return res.status(200).json({ resposta: respostaTexto });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ resposta: "[SISTEMA]: Falha no barramento de conexão com a Groq Cloud." });
  }
}
