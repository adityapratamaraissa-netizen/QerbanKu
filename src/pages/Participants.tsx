import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, History, Users, Heart, ShieldCheck, Filter } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { PaymentStatus, QurbanType } from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ParticipantRecord {
  id: string;
  name: string;
  qurbanFor: string;
  type: QurbanType;
  paymentStatus: PaymentStatus;
  createdAt: any;
}

export default function Participants() {
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | QurbanType>("ALL");

  useEffect(() => {
    const q = query(
      collection(db, "participants"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ParticipantRecord[];
      setParticipants(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.qurbanFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === "ALL" || p.type === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header section */}
      <section className="bg-primary pt-12 pb-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/20">
              <History size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Live Updates</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Riwayat Mudhohi</h1>
            <p className="text-xl text-white/70 font-medium font-serif italic">
              "Daftar jamaah yang telah menitipkan ibadah kurbannya melalui Kurban AI 1447H."
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-stone-900/5 border border-stone-100 overflow-hidden min-h-[600px]">
          
          {/* Controls Bar */}
          <div className="p-8 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              <Filter size={18} className="text-stone-400 mr-2 shrink-0" />
              {(["ALL", QurbanType.SAPI, QurbanType.KAMBING] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                    activeFilter === filter 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white text-stone-500 border border-stone-200 hover:border-primary/30"
                  )}
                >
                  {filter === "ALL" ? "Semua" : filter}
                </button>
              ))}
            </div>
          </div>

          {/* List Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-stone-100 border-t-primary rounded-full animate-spin"></div>
                <p className="text-stone-400 font-medium">Memuat data mudhohi...</p>
              </div>
            ) : filteredParticipants.length > 0 ? (
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-stone-50/30">
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Mudhohi</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Niat Qurban Untuk</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Tipe</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredParticipants.map((p, index) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-stone-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                            p.type === QurbanType.SAPI ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                          )}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3436] group-hover:text-primary transition-colors">{p.name}</p>
                            <p className="text-[10px] font-mono text-stone-400">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-stone-600 font-medium italic">
                          <Heart size={14} className="text-secondary opacity-50" />
                          {p.qurbanFor}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <span className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                            p.type === QurbanType.SAPI 
                              ? "bg-amber-50 border-amber-100 text-amber-600" 
                              : "bg-emerald-50 border-emerald-100 text-emerald-600"
                          )}>
                            {p.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          {p.paymentStatus === PaymentStatus.PAID ? (
                            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                              <ShieldCheck size={14} />
                              LUNAS
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-secondary text-xs font-bold animate-pulse">
                              <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                              PENDING
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-medium text-stone-500">
                          {p.createdAt?.toDate ? format(p.createdAt.toDate(), "d MMM yyyy", { locale: id }) : "---"}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {p.createdAt?.toDate ? format(p.createdAt.toDate(), "HH:mm") : "---"} WIB
                        </p>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-32 text-center">
                <Search size={48} className="mx-auto text-stone-100 mb-4" />
                <p className="text-stone-400 font-medium">Tidak ada data mudhohi yang ditemukan.</p>
                <button onClick={() => {setSearchTerm(""); setActiveFilter("ALL")}} className="text-primary font-bold text-sm mt-2 hover:underline">Reset pencarian</button>
              </div>
            )}
          </div>

          {/* Footer of the card */}
          <div className="p-8 bg-stone-50/50 border-t border-stone-100 text-center">
            <p className="text-stone-400 text-xs flex items-center justify-center gap-2">
              <Users size={14} />
              Total {filteredParticipants.length} Mudhohi Terdaftar
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
