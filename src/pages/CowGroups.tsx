import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, AlertCircle, CheckCircle2, TrendingUp, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, getDocs, where } from "firebase/firestore";
import { Link } from "react-router-dom";

interface SapiGroup {
  id: string;
  groupNumber: number;
  participantIds: string[];
  participantNames?: string[];
  isFull: boolean;
  totalAmount: number;
}

export default function CowGroups() {
  const [groups, setGroups] = useState<SapiGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "groups"), orderBy("groupNumber", "asc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as SapiGroup));

      setGroups(groupsData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error in CowGroups:", err);
      handleFirestoreError(err, OperationType.LIST, "groups");
    });

    return unsub;
  }, []);

  const totalSlots = groups.length * 7;
  const filledSlots = groups.reduce((acc, g) => acc + g.participantIds.length, 0);
  const availableSlots = totalSlots - filledSlots;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat kelompok...</div>;

  return (
    <div className="bg-[#F4F7F5] dark:bg-stone-950 min-h-screen py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Kolektif Sapi</span>
            <h1 className="text-5xl font-bold text-[#2D3436] dark:text-white tracking-tight">Kelompok Patungan.</h1>
            <p className="text-stone-500 font-medium max-w-xl leading-relaxed">
              Sistem membagi peserta ke dalam kelompok berisi 7 orang secara otomatis sesuai syariat Islam.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white dark:bg-stone-900 px-8 py-6 rounded-3xl shadow-sm border border-gray-100 dark:border-stone-800 flex items-center gap-6">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                   <TrendingUp size={28} />
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Sapi</p>
                   <p className="text-3xl font-bold text-secondary tracking-tighter">{groups.length}</p>
                </div>
             </div>
             <div className="bg-white dark:bg-stone-900 px-8 py-6 rounded-3xl shadow-sm border border-gray-100 dark:border-stone-800 flex items-center gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                   <Users size={28} />
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Tersedia</p>
                   <p className="text-3xl font-bold text-primary tracking-tighter">{availableSlots}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group bg-white dark:bg-stone-900 rounded-[3rem] border p-10 shadow-sm border-gray-100 dark:border-stone-800 transition-all hover:shadow-2xl hover:shadow-stone-200/50 hover:translate-y-[-8px]",
                group.isFull ? "border-primary/20 bg-accent/10" : ""
              )}
            >
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-1">Hewan Kolektif</span>
                  <h3 className="text-3xl font-bold text-[#2D3436] dark:text-white tracking-tight">SAPI #{group.groupNumber}</h3>
                </div>
                {group.isFull ? (
                  <div className="bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20">
                    <CheckCircle2 size={12} /> Penuh
                  </div>
                ) : (
                  <div className="bg-[#FFF8E1] text-[#C5A059] text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#C5A059]/10">
                    {7 - group.participantIds.length} Slot Sisa
                  </div>
                )}
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress Kolektif</p>
                      <p className="text-sm font-bold text-primary">{Math.round((group.participantIds.length/7)*100)}%</p>
                   </div>
                   <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(group.participantIds.length/7)*100}%` }}
                         className={cn(
                           "h-full rounded-full",
                           group.isFull ? "bg-primary" : "bg-secondary"
                         )}
                      />
                   </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mudhohi Anggota</p>
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const participantName = group.participantNames?.[i];
                      return (
                        <div key={i} className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border text-sm transition-all",
                          participantName 
                            ? "bg-gray-50 dark:bg-stone-800 border-gray-100 dark:border-stone-700 text-[#2D3436] dark:text-stone-100" 
                            : "bg-transparent border-dashed border-gray-200 dark:border-stone-800 text-stone-300"
                        )}>
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border",
                              participantName ? "border-primary/20 text-primary" : "border-stone-200 text-stone-300"
                            )}>{i + 1}</span>
                            <span className="font-semibold tracking-tight">{participantName || "Menunggu Peserta..."}</span>
                          </div>
                          {participantName && (
                             <Check size={16} className="text-primary" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50 dark:border-stone-800 flex justify-between items-center">
                   <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Infaq Terkumpul</p>
                      <p className="text-xl font-bold text-primary">Rp {group.totalAmount?.toLocaleString() || 0}</p>
                   </div>
                   {!group.isFull && (
                      <Link to="/daftar" className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-[#144318] hover:translate-y-[-2px] transition-all">
                        Ikut Serta
                      </Link>
                   )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* New Group Placeholder */}
          <div className="bg-stone-50/50 dark:bg-stone-900/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-stone-800 p-12 flex flex-col items-center justify-center text-center space-y-6 opacity-60">
             <div className="w-20 h-20 bg-white dark:bg-stone-800 rounded-3xl flex items-center justify-center text-gray-200 shadow-sm border border-gray-100 dark:border-stone-700">
                <Users size={40} />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-bold text-stone-300 tracking-tight">Grup Berikutnya</h3>
                <p className="text-sm text-stone-400 font-medium">Sistem otomatis membuka slot <br />setelah grup sebelumnya penuh.</p>
             </div>
          </div>
        </div>

        <div className="mt-24 p-10 bg-white dark:bg-stone-900 rounded-[3rem] border border-gray-100 dark:border-stone-800 flex flex-col md:flex-row items-center gap-10 shadow-sm">
           <div className="w-20 h-20 bg-accent text-primary rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner">
              <AlertCircle size={40} />
           </div>
           <div className="flex-1 space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Syariat & Amanah</span>
              <h4 className="text-2xl font-bold text-[#2D3436] dark:text-blue-100">Ketentuan Patungan Sapi.</h4>
              <p className="text-stone-500 font-medium leading-relaxed">
                Setiap sapi dikelola oleh panitia dengan pengawasan ketat untuk memastikan syarat qurban terpenuhi. Nama Mudhohi akan dibacakan saat proses penyembelihan berlangsung.
              </p>
           </div>
           <button className="whitespace-nowrap px-10 py-5 bg-stone-50 dark:bg-stone-800 text-[#2D3436] dark:text-blue-400 font-bold rounded-2xl shadow-sm border border-gray-100 dark:border-stone-800 hover:bg-white transition-all">
              Hubungi Panitia
           </button>
        </div>
      </div>
    </div>
  );
}
