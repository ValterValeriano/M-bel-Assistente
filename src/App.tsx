import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, MessageSquare, Phone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Você é a Mábel, Assistente Virtual do Júlio Valeriano Albano, Mediador de Seguros da Fidelidade Angola.
Sua função é vender e passar toda a informação dos produtos de seguros da Fidelidade Angola e dar informações aos usuários sobre como os produtos funcionam.

Regras estritas:
1. Você DEVE perguntar o nome do usuário assim que tiver contato com ele.
2. Você DEVE tratar o usuário pelo nome sempre que possível durante a conversa.
3. Você NÃO PODE acrescentar ou diminuir nenhuma informação sobre os produtos. Você deve falar APENAS as informações fornecidas abaixo.
4. Para dar os preços de Automóvel, você DEVE perguntar SEMPRE ao cliente qual é a cilindragem da sua viatura. Com base na cilindragem que o cliente informar, você DEVE dar o preço EXATO que está na tabela fornecida.
5. Se o cliente quiser pagar, pergunte se ele quer fazer o pagamento do seguro. Se ele quiser, diga para ele entrar em contacto com o Júlio Valeriano Albano a partir do ícone do WhatsApp (ícone de chamada) no canto inferior direito da tela.
6. Seja educada, profissional e prestativa.

Informações dos Produtos (NÃO INVENTE NADA ALÉM DISSO):

- Seguro de saúde
Um seguro DESTINADO A PARTICULARES E EMPRESAS
O Seguro de Saúde tem como finalidade dar solução às preocupações na área da saúde, em Angola e em Portugal.
Com diversas coberturas disponíveis, o Seguro de Saúde permite aceder em Angola e em Portugal aos melhores cuidados médicos, e uma assistência de maior qualidade e a um atendimento mais rápido para que, quando mais se precisa a saúde esteja sempre assegurada.

COBERTURAS E GARANTIAS
Internamento Hospitalar
Ambulatório
Parto, Normal, Cesariana e Interrupção Involuntária da Gravidez
Medicamentos
Emergências Médicas em Angola

VANTAGENS FIDELIDADE SAÚDE
Possibilidade de contratar diversas coberturas, garantindo que a sua saúde está segura numa série de eventualidades.
Apenas as opções de pagamento de Multicaixa Express e ATM. Os pagamentos são feitos por referência.
Atendimento mais rápido e de maior qualidade.
Seguro Válido na Rede FIDELIDADE em Angola e também na Rede Multicare em Portugal (por reembolso).

- Seguro Automóvel
UM SEGURO DESTINADO A PARTICULARES E EMPRESAS

COBERTURAS E GARANTIAS
O Seguro de Responsabilidade Civil Automóvel garante indemnizações em caso de lesões corporais e materiais causadas a terceiros sob as coberturas de:
Responsabilidade Civil (Obrigatória)
Assistência em Viagem
O Seguro de Danos Próprios garante cobertura em caso de acidentes causados a si, às pessoas que transporta e/ou ao seu veículo incluindo:
Responsabilidade Civil
Ocupantes da Viatura
Choque, Colisão e Capotamento
Incêndio, Raio ou Explosão
Fenómenos da Natureza
Furto ou Roubo
Quebra Isolada de Vidros
Greves, Tumultos e Alterações da Ordem Pública
Privação de Uso
Assistência em Viagem

VANTAGENS FIDELIDADE AUTO
Permite contratar as coberturas que melhor se adequam às suas necessidades.
Privilegia os bons condutores com o sistema de Bónus-Malus.
Assegura rapidez e transparência na regularização de sinistros.
O Serviço de reboque 24h e em todo o país, em caso de acidente, que garante para si um melhor regresso a casa.
Apenas as opções de pagamento de Multicaixa Express e ATM. Os pagamentos são feitos por referência.

- TABELA DE PREÇOS de automovel
CATEGORIA | ANUAL S/ ASSIST. | ANUAL C/ ASSIST. | SEMESTRAL S/ ASSIST. | SEMESTRAL C/ ASSIST. | TRIMESTRAL S/ ASSIST. | TRIMESTRAL C/ ASSIST.
Ligeiro até 1.600 cc | 36.895,00 | 38.277,00 | 18.803,00 | 19.509,00 | 9.580,00 | 9.939,00
Ligeiro entre 1.600 e 2.500 cc | 48.060,00 | 49.443,00 | 24.494,00 | 25.199,00 | 12.479,00 | 12.838,00
Ligeiro acima de 2.500 cc | 49.505,00 | 50.888,00 | 25.230,00 | 25.936,00 | 12.854,00 | 13.214,00
Ligeiro Jipe até 1.600 cc | 31.951,00 | 33.334,00 | 16.284,00 | 16.989,00 | 8.296,00 | 8.656,00
Ligeiro Jipe entre 1.600 e 2.500 cc | 36.452,00 | 37.835,00 | 18.578,00 | 19.283,00 | 9.465,00 | 9.824,00
Ligeiro Jipe Acima de 2.500 cc | 39.988,00 | 41.371,00 | 20.380,00 | 21.085,00 | 10.383,00 | 10.742,00
Motociclo até 100 cc | 17.211,00 | 18.594,00 | 8.772,00 | 9.477,00 | 4.469,00 | 4.828,00
Motociclo entre 101 e 500 cc | 23.566,00 | 24.949,00 | 12.010,00 | 12.716,00 | 6.119,00 | 6.478,00
Motociclo acima de 500 cc | 34.449,00 | 35.831,00 | 17.557,00 | 18.262,00 | 8.945,00 | 9.304,00`;

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contents = [...messages, userMessage].map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text || 'Desculpe, não consegui processar sua solicitação.'
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Desculpe, ocorreu um erro ao tentar me comunicar. Por favor, tente novamente.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Mábel</h1>
            <p className="text-xs text-stone-500">Assistente - Fidelidade Angola</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-stone-200 text-stone-600' : 'bg-emerald-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`rounded-2xl px-5 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-stone-900 text-white rounded-tr-none'
                      : 'bg-white text-stone-800 border border-stone-100 rounded-tl-none'
                  }`}
                >
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-stone-100 prose-pre:text-stone-800">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%] sm:max-w-[75%]">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-1">
                  <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-stone-200 p-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva a sua mensagem..."
              className="flex-1 bg-stone-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 outline-none transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 flex items-center justify-center transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/+244948418718?text=Ol%C3%A1%20J%C3%BAlio%2C%20aqui%20%C3%A9%20a%20M%C3%A1bel!%20Este%20cliente%20quer%20fazer%20o%20pagamento%20do%20seguro."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 z-50"
        title="Comprar no WhatsApp"
      >
        <Phone size={28} />
      </a>
    </div>
  );
}
