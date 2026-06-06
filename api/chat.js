export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    const { mensagem } = await req.json();
    
    // Puxa a variável (Certifique-se de que o NOME na Vercel está exatamente GROQ_API_KEY)
    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return new Response(JSON.stringify({ resposta: "[SISTEMA]: Variável GROQ_API_KEY não localizada no servidor Vercel." }), { status: 401 });
    }

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português.";

    const respostaGroq = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY.trim()}`
      },
      body: JSON.stringify({
        // Atualizado para o modelo estável mais inteligente e aceito na Groq Cloud
        model: "llama-3.3-70b-versatile", 
        messages: [
          { role: "system", content: instrucaoSistema },
          { role: "user", content: mensagem }
        ],
        temperature: 0.7
      })
    });

    const dadosJSON = await respostaGroq.json();

    // Se a Groq devolver um erro de chave inválida, o código captura e imprime o motivo real
    if (dadosJSON.error) {
      return new Response(JSON.stringify({ resposta: `[GROQ ERROR]: ${dadosJSON.error.message}` }), { status: 400 });
    }

    const respostaTexto = dadosJSON.choices[0].message.content;

    return new Response(JSON.stringify({ resposta: respostaTexto }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ resposta: "[SISTEMA]: Falha crítica no barramento interno de dados." }), { status: 500 });
  }
}
