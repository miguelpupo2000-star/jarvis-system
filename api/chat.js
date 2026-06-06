// api/chat.js (Com depuração avançada de pacotes de dados)
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
      return res.status(401).json({ resposta: "[SISTEMA]: A variável GROQ_API_KEY não foi encontrada na Vercel." });
    }

    API_KEY = API_KEY.trim().replace(/['"]+/g, '');

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português.";

    const respostaGroq = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", 
        messages: [
          { role: "system", content: instrucaoSistema },
          { role: "user", content: mensagem }
        ]
      })
    });

    const dadosJSON = await respostaGroq.json();

    // 🎯 SE A GROQ DEVOLVER UM ERRO, EXIBE ELE DIRETO NA TELA DO CHAT
    if (dadosJSON.error) {
      return res.status(400).json({ resposta: `[GROQ API ERROR]: ${dadosJSON.error.message}` });
    }

    // Se a estrutura vier certa, ele responde normalmente
    if (dadosJSON.choices && dadosJSON.choices[0] && dadosJSON.choices[0].message) {
      const respostaTexto = dadosJSON.choices[0].message.content;
      return res.status(200).json({ resposta: respostaTexto });
    }

    // Caso o formato do JSON mude, exibe o objeto cru para sabermos o que ler
    return res.status(200).json({ resposta: `[LOG SISTEMA]: Resposta recebida em formato alternativo: ${JSON.stringify(dadosJSON)}` });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ resposta: `[ERRO INTERNO]: Falha ao processar dados de rede: ${error.message}` });
  }
}
