import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Smartphone } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show after 5 seconds to not be annoying
      setTimeout(() => setShowBanner(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[60] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-primary/20 p-4"
      >
        <button 
          onClick={() => setShowBanner(false)}
          className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">Pasang QurbanKu</h3>
            <p className="text-xs text-stone-500 mt-1">Akses lebih cepat & mudah langsung dari layar utama Anda.</p>
            <button
              onClick={handleInstall}
              className="mt-3 w-full py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
            >
              <Download size={14} />
              Install Sekarang
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
