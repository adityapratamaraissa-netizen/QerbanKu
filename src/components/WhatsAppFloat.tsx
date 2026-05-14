import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/6285815017403"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:bg-green-600 transition-all active:scale-90 animate-float"
      aria-label="Contact Admin on WhatsApp"
    >
      <MessageCircle size={32} fill="currentColor" />
    </a>
  );
}
