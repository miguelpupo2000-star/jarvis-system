// api/chat.js (Função que roda escondida nos servidores da Vercel)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Configuração padrão de segurança para o seu site ter acesso
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
    
    // Puxa a chave gsk_ que vai ficar embutida e protegida no painel da Vercel
    const API_KEY = process.env.GROQ_API_KEY;

    const instrucaoSistema = "Você é o JARVIS, a inteligência artificial leal e superinteligente criada para gerenciar as telas do Senhor Miguel. Responda de forma britânica, cortês, extremamente inteligente e direta, tratando o Miguel sempre por 'Senhor' ou 'Sir Miguel'. Você tem acesso total aos dados do portfólio dele (Simulador de Celular, Catálogo de Empilhadeiras e Showroom da Apex Motors). Mantenha o tom altamente tecnológico de ficção científica e responda sempre em português de forma concisa.";

    // Conversa com os servidores da Groq de forma segura (Back-to-Back)
    const respostaGroq = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY.trim()}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Modelo estável e rápido da Groq
        messages: [
          { role: "system", content: instrucaoSistema },
          { role: "user", content: mensagem }
        ],
        temperature: 0.7
      })
    });

    const dadosJSON = await respostaGroq.json();
    const respostaTexto = dadosJSON.choices[0].message.content; // Mapeamento do JSON corrigido

    return new Response(JSON.stringify({ resposta: respostaTexto }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ resposta: "[SISTEMA]: Falha na comunicação com o núcleo central da Groq Cloud." }), { status: 500 });
  }
}
