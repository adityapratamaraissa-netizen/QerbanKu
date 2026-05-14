import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Heart, Sparkles } from "lucide-react";

interface Activity {
  id: string;
  name: string;
  type: string;
  timestamp: any;
}

export default function LiveActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "participants"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        type: doc.data().type,
        timestamp: doc.data().createdAt
      })) as Activity[];
      setActivities(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activities.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % activities.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activities]);

  if (activities.length === 0) return null;

  return (
    <div className="h-10 flex items-center overflow-hidden bg-white/40 backdrop-blur-md px-6 rounded-full border border-white/50 shadow-sm max-w-fit mx-auto lg:mx-0">
      <Sparkles className="text-secondary shrink-0 mr-3" size={14} />
      <div className="relative h-full flex-1 overflow-hidden min-w-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="h-full flex items-center gap-2"
          >
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">Baru Saja:</span>
            <span className="text-xs font-bold text-primary whitespace-nowrap">{activities[currentIndex].name}</span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {activities[currentIndex].type}
            </span>
            <Heart size={10} className="text-secondary fill-secondary" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
