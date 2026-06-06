// api/chat.js (Código definitivo com limpeza automática de aspas e chaves)
export default async function handler(req, res) {
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
      return res.status(401).json({ resposta: "[SISTEMA]: Variável GROQ_API_KEY vazia no painel Vercel." });
    }

    // Limpeza profunda contra aspas ou espaços invisíveis copiados sem querer
    API_KEY = API_KEY.trim().replace(/['"]+/g, '');

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português.";

    const respostaGroq = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Retornado para o modelo clássico super estável
        messages: [
          { role: "system", content: instrucaoSistema },
          { role: "user", content: mensagem }
        ]
      })
    });

    const dadosJSON = await respostaGroq.json();

    // Se o token estiver vencido, o próprio JSON avisa o motivo
    if (dadosJSON.error) {
      return res.status(400).json({ resposta: `[GROQ DETECTED]: ${dadosJSON.error.message}` });
    }

    const respostaTexto = dadosJSON.choices[0].message.content; // Correção cirúrgica na leitura do array choices da Groq!

    return res.status(200).json({ resposta: respostaTexto });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ resposta: "[SISTEMA]: O núcleo da Groq respondeu, mas os dados foram bloqueados. Verifique as credenciais no painel." });
  }
}
