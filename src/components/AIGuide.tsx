import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, MessageSquare, Send, X, Bot, Info, Heart } from "lucide-react";
import { cn } from "../lib/utils";

export default function AIGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Assalamu'alaikum! Saya Asisten AI Kurban 1447H. Ada yang bisa saya bantu terkait ibadah qurban Anda tahun ini?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    
    setInput("");
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error("Failed to fetch AI response");
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', content: data.text }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Maaf, layanan AI sedang sibuk. Silakan tanyakan langsung ke panitia via WhatsApp." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 md:bottom-8 md:left-auto md:right-32 z-50 bg-primary text-white p-3 md:p-4 rounded-2xl shadow-2xl shadow-primary/30 flex items-center gap-2 group"
      >
        <div className="relative">
          <Sparkles className="group-hover:rotate-12 transition-transform h-5 w-5 md:h-6 md:w-6" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-ping"></div>
        </div>
        <span className="font-bold text-xs md:text-sm">Tanya AI</span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-0 right-0 md:bottom-28 md:right-8 z-50 w-full md:w-[400px] h-full md:h-[600px] md:max-h-[80vh] bg-white rounded-none md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">AI Assistant</h3>
                  <div className="flex items-center gap-1.5 opacity-70">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Always Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed",
                    m.role === 'user' 
                      ? "bg-primary text-white ml-auto rounded-tr-none shadow-md shadow-primary/10" 
                      : "bg-white text-stone-700 mr-auto rounded-tl-none border border-stone-100 shadow-sm"
                  )}
                >
                  {m.content}
                </motion.div>
              ))}
              {isLoading && (
                <div className="bg-white text-stone-700 p-4 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm mr-auto max-w-[85%] flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Input */}
            <div className="p-6 bg-white border-t border-stone-100">
              <div className="flex gap-2 mb-3">
                {["Pilih Sapi/Kambing?", "Apa itu Qurban Digital?", "Harga qurban"].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-[10px] font-bold py-1.5 px-3 bg-stone-50 text-stone-500 rounded-full border border-stone-100 hover:border-primary/30 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ketik pesan Anda..."
                  className="w-full pl-6 pr-14 py-4 bg-stone-50 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-[#144318] transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[9px] text-stone-400 mt-4 text-center">
                Powered by <span className="font-bold text-primary">Kurban AI Gemini</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
