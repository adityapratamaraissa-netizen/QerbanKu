import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Wallet, CheckCircle2, Clock, AlertTriangle, FileText, Share2, ArrowRight, Download, ShieldCheck } from "lucide-react";
import { PaymentStatus, QurbanType } from "../types";
import { cn } from "../lib/utils";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import toast from "react-hot-toast";

interface ParticipantResult {
  id: string;
  name: string;
  qurbanFor: string;
  type: QurbanType;
  amount: number;
  paymentStatus: PaymentStatus;
  createdAt: any;
  groupId?: string;
  groupName?: string;
}

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<ParticipantResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    setResult(null);

    try {
      let participantData: any = null;

      // Try searching by ID first (must be uppercase)
      const formattedId = searchQuery.trim().toUpperCase();
      const docRef = doc(db, "participants", formattedId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        participantData = { ...docSnap.data() };
      } else {
        // Try searching by WhatsApp
        const participantsRef = collection(db, "participants");
        const q = query(participantsRef, where("whatsapp", "==", searchQuery.trim()), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          participantData = { ...querySnapshot.docs[0].data() };
        }
      }

      if (participantData) {
        // If it's a SAPI, fetch the group name for UI
        if (participantData.type === QurbanType.SAPI && participantData.groupId) {
          const groupSnap = await getDoc(doc(db, "groups", participantData.groupId));
          if (groupSnap.exists()) {
            participantData.groupName = `SAPI #${groupSnap.data().groupNumber}`;
          }
        }
        setResult(participantData as ParticipantResult);
      } else {
        toast.error("Data tidak ditemukan. Pastikan ID atau No. WhatsApp benar.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "participants");
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "---";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="bg-[#F4F7F5] dark:bg-stone-950 min-h-screen py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-1 bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">E-Verification</span>
            <div className="w-10 h-1 bg-primary rounded-full"></div>
          </div>
          <h1 className="text-5xl font-bold text-[#2D3436] dark:text-white tracking-tight">Cek Status.</h1>
          <p className="text-stone-500 max-w-lg mx-auto font-medium">Validasi status pembayaran dan nomor antrian qurban Anda secara real-time.</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-2.5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-stone-800 mb-16">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan ID (Q-XXXXX) atau No. WhatsApp"
                className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-gray-50 dark:bg-stone-950 border-none focus:ring-2 focus:ring-primary/20 outline-none text-base font-medium transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-primary text-white px-12 py-5 rounded-[2rem] font-bold shadow-xl shadow-primary/20 hover:bg-[#144318] hover:translate-y-[-2px] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isSearching ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Cek Sekarang</span> <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[3.5rem] border border-gray-50 dark:border-stone-800 shadow-sm p-10 md:p-16 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl -z-0" />
                
                <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                  <div className="space-y-10 flex-grow">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block">Profil Mudhohi</span>
                      <h3 className="text-4xl font-bold text-[#2D3436] dark:text-white tracking-tight">{result.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">ID Registrasi</p>
                        <p className="text-xl font-bold font-mono tracking-tighter text-primary">{result.id}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Tipe Qurban</p>
                        <p className="text-xl font-bold text-[#2D3436] tracking-tight">{result.type === QurbanType.KAMBING ? "KAMBING" : "Patungan SAPI"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Pemberi Qurban</p>
                        <p className="text-xl font-bold text-[#2D3436] tracking-tight">{result.qurbanFor}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Kelompok</p>
                        <p className="text-xl font-bold text-secondary tracking-tight">{result.groupName || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center lg:items-end justify-center min-w-[280px] p-8 bg-gray-50 dark:bg-stone-800 rounded-3xl border border-gray-100 dark:border-stone-700">
                    <div className={cn(
                      "mb-6 w-24 h-24 rounded-full flex items-center justify-center shadow-inner transition-colors",
                      result.paymentStatus === PaymentStatus.PAID ? "bg-primary text-white" : 
                      result.paymentStatus === PaymentStatus.VERIFYING ? "bg-[#FFF8E1] text-secondary" : 
                      result.paymentStatus === PaymentStatus.REJECTED ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"
                    )}>
                      {result.paymentStatus === PaymentStatus.PAID ? <CheckCircle2 size={48} /> : 
                       result.paymentStatus === PaymentStatus.VERIFYING ? <Clock size={48} /> : 
                       result.paymentStatus === PaymentStatus.REJECTED ? <AlertTriangle size={48} /> : <Clock size={48} />}
                    </div>
                    <div className="text-center lg:text-right space-y-1">
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full inline-block mb-2",
                        result.paymentStatus === PaymentStatus.PAID ? "bg-primary/10 text-primary" : 
                        result.paymentStatus === PaymentStatus.REJECTED ? "bg-red-50 text-red-600" : "bg-secondary/10 text-secondary"
                      )}>
                        {result.paymentStatus === PaymentStatus.PAID ? "Pembayaran Lunas" : 
                         result.paymentStatus === PaymentStatus.VERIFYING ? "Verifikasi Berkas" : 
                         result.paymentStatus === PaymentStatus.REJECTED ? "Ditolak / Gagal" : "Menunggu Bayar"}
                      </p>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Tgl Daftar: {formatDate(result.createdAt)}</p>
                      
                      {result.paymentStatus !== PaymentStatus.PAID && (
                        <div className="mt-4">
                          <a 
                            href={`https://wa.me/6285815017403?text=Halo%20Admin%20Masjid%20Miftahul%20Huda,%20saya%20ingin%20konfirmasi%20pembayaran%20dengan%20ID:%20${result.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-primary hover:underline border border-primary/20 px-3 py-1 rounded-lg bg-primary/5 inline-flex items-center gap-1"
                          >
                            Konfirmasi via WA
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-16 pt-10 border-t border-gray-50 dark:border-stone-800 flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 flex items-center justify-center gap-3 py-5 bg-[#2D3436] text-white rounded-2xl font-bold shadow-xl shadow-stone-900/10 hover:bg-black transition-all">
                    <Download size={20} /> Unduh Sertifikat
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-3 py-5 bg-white dark:bg-stone-800 text-[#2D3436] dark:text-white rounded-2xl font-bold border border-gray-100 dark:border-stone-700 hover:bg-gray-50 dark:hover:bg-stone-700 transition-all">
                    <Share2 size={20} /> Bagikan Status
                  </button>
                </div>
              </div>

              {/* Info Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#FFF8E1] p-8 rounded-[2.5rem] border border-[#C5A059]/10 flex gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-secondary shadow-sm shrink-0">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-[#C5A059] tracking-tight">Butuh Konfirmasi?</h4>
                    <p className="text-sm text-[#C5A059]/70 font-medium">Jika data belum terverifikasi dalam 12 jam, hubungi admin via tombol WhatsApp di pojok kanan bawah.</p>
                  </div>
                </div>
                <div className="bg-accent/40 p-8 rounded-[2.5rem] border border-primary/5 flex gap-6">
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-primary tracking-tight">Keamanan Data</h4>
                    <p className="text-sm text-primary/70 font-medium">Platform kami menjaga privasi Mudhohi dengan enkripsi data untuk transaksi yang aman dan amanah.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !isSearching && (
          <div className="text-center py-32 opacity-40">
             <div className="w-32 h-32 bg-white dark:bg-stone-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-gray-50 border-stone-800">
                <Search size={48} className="text-gray-200" />
             </div>
             <p className="text-xl font-bold text-stone-300 tracking-tight">Masukkan ID Peserta Anda.</p>
             <p className="text-sm text-stone-300 mt-1">Data akan muncul setelah dilakukan pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
