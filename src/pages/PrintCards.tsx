import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Download, Printer, QrCode, Heart, Search, ChevronRight, User, ShieldCheck, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PaymentStatus, QurbanType } from "../types";
import toast from "react-hot-toast";

export default function PrintCards() {
  const [searchId, setSearchId] = useState("");
  const [participant, setParticipant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    // Sanitize and validate input
    const trimmedId = searchId.trim().toUpperCase();
    if (trimmedId.length < 7) {
      toast.error("ID Peserta minimal 7 karakter (Contoh: Q-12345)");
      return;
    }

    setIsLoading(true);
    setParticipant(null);

    try {
      const pDocRef = doc(db, "participants", trimmedId);
      const pSnapshot = await getDoc(pDocRef);

      if (!pSnapshot.exists()) {
        toast.error("Data peserta tidak ditemukan.");
        return;
      }

      const pData = pSnapshot.data();

      // Set base participant data common to both types
      const baseData = {
        id: pData.id,
        name: pData.name,
        qurbanFor: pData.qurbanFor,
        amount: pData.amount,
        paymentStatus: pData.paymentStatus,
        paymentMethod: pData.paymentMethod,
        type: pData.type
      };

      if (pData.type === QurbanType.KAMBING) {
        setParticipant({
          ...baseData,
          animalId: pData.id
        });
      } else {
        // Fetch group members for SAPI
        const groupId = pData.groupId;
        let groupMembers: string[] = [pData.qurbanFor];
        let groupNumber = "??";

        if (groupId) {
          const participantsRef = collection(db, "participants");
          const q = query(
            participantsRef, 
            where("groupId", "==", groupId)
          );
          const membersSnapshot = await getDocs(q);
          groupMembers = membersSnapshot.docs.map(doc => doc.data().qurbanFor);
          
          const groupNumberMatches = groupId.match(/\d+/);
          groupNumber = groupNumberMatches ? groupNumberMatches[0] : "??";
        }

        setParticipant({
          ...baseData,
          groupMembers: groupMembers,
          animalId: `SAPI-1447-${groupNumber.padStart(3, '0')}`
        });
      }
      
      toast.success("Data berhasil ditemukan!");
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Terjadi kesalahan saat memproses data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2]
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`kartu-qurban-${participant.animalId}.pdf`);
  };

  return (
    <div className="bg-[#F4F7F5] dark:bg-stone-950 min-h-screen py-24 px-4 bg-pattern no-print">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-1 bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">E-Label System</span>
            <div className="w-10 h-1 bg-primary rounded-full"></div>
          </div>
          <h1 className="text-5xl font-bold text-[#2D3436] dark:text-white tracking-tight">Cetak Kartu.</h1>
          <p className="text-stone-500 max-w-lg mx-auto font-medium">Cetak identitas resmi untuk hewan qurban Anda dengan desain modern dan rapi.</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-2.5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-stone-800 mb-16">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
               <input
                 value={searchId}
                 onChange={(e) => setSearchId(e.target.value)}
                 placeholder="ID Peserta (Contoh: Q-12847)"
                 className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-gray-50 dark:bg-stone-950 border-none focus:ring-2 focus:ring-primary/20 outline-none text-base font-medium transition-all"
               />
            </div>
            <button
               onClick={handleSearch}
               disabled={isLoading}
               className="bg-[#2D3436] text-white px-12 py-5 rounded-[2rem] font-bold shadow-xl shadow-stone-900/10 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
               {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Cari Data"}
            </button>
          </div>
        </div>

        {participant && (
          <div className="space-y-16">
            {/* Status Information Bar */}
            <div className={cn(
              "p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6",
              participant.paymentStatus === PaymentStatus.PAID 
                ? "bg-primary/5 border-primary/20 text-primary" 
                : participant.paymentStatus === PaymentStatus.VERIFYING
                ? "bg-secondary/5 border-secondary/20 text-secondary"
                : "bg-red-50 border-red-100 text-red-500"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-white",
                  participant.paymentStatus === PaymentStatus.PAID ? "text-primary" : "text-secondary"
                )}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status Pembayaran</p>
                  <p className="text-lg font-bold tracking-tight">
                    {participant.paymentStatus === PaymentStatus.PAID 
                      ? "Terverifikasi (Lunas)" 
                      : participant.paymentStatus === PaymentStatus.VERIFYING
                      ? "Menunggu Verifikasi Panitia"
                      : "Belum Terverifikasi / Pending"}
                  </p>
                  {participant.paymentMethod && (
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mt-0.5">
                      Metode: {participant.paymentMethod.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              {participant.paymentStatus !== PaymentStatus.PAID && (
                <div className="text-sm font-medium px-6 py-2 bg-white rounded-full shadow-sm">
                  Cek kembali beberapa saat lagi atau hubungi panitia via WhatsApp.
                </div>
              )}
            </div>

            <div className="flex justify-center">
              {/* ATCHUAL CARD PREVIEW */}
              <div 
                ref={cardRef}
                className={cn(
                  "w-[420px] bg-white text-[#2D3436] rounded-[3.5rem] shadow-2xl border border-gray-100 p-2 overflow-hidden print:shadow-none print:border-2",
                  participant.paymentStatus !== PaymentStatus.PAID && "grayscale opacity-50 pointer-events-none"
                )}
              >
                {participant.paymentStatus !== PaymentStatus.PAID && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center -rotate-12">
                    <div className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold border-4 border-white shadow-2xl text-2xl tracking-tighter">
                      BELUM TERVERIFIKASI
                    </div>
                  </div>
                )}
                <div className="bg-[#2D3436] p-10 text-white text-center rounded-[2.8rem] relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                   <div className="flex justify-center mb-4 relative z-10">
                      <Heart fill="white" size={32} className="text-primary" />
                   </div>
                   <h2 className="text-2xl font-bold tracking-tight mb-1 relative z-10">LABEL HEWAN QURBAN</h2>
                   <p className="text-[10px] tracking-[0.4em] font-bold opacity-60 uppercase relative z-10">Idul Adha 1447 H / 2026 M</p>
                </div>
                
                <div className="p-10 space-y-10 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomor Identitas</p>
                       <p className="text-3xl font-bold font-mono tracking-tighter text-[#2D3436]">{participant.animalId}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                      <QRCodeSVG value={participant.animalId} size={70} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Klasifikasi</p>
                       <div className="flex items-center gap-2">
                          <p className="text-xl font-bold">{participant.type}</p>
                          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-stone-500 font-bold">{participant.type === "SAPI" ? "KOLEKTIF" : "PERORANGAN"}</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daftar Mudhohi</p>
                       {participant.type === "SAPI" ? (
                         <div className="grid grid-cols-1 gap-2">
                            {participant.groupMembers.map((name: string, i: number) => (
                              <div key={i} className="text-sm flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 italic">
                                <span className="text-[10px] font-bold text-primary w-4">{i+1}</span>
                                <span className="font-bold tracking-tight">{name}</span>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="p-4 bg-accent/20 rounded-2xl border border-primary/5">
                            <p className="text-2xl font-bold italic text-primary">{participant.qurbanFor}</p>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-dashed border-gray-200 text-center space-y-2">
                     <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">PANITIA MASJID MIFTAHUL HUDA</p>
                     <div className="flex items-center justify-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">Sistem Verifikasi Digital Terpadu</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
               <button 
                 onClick={handleDownloadPDF}
                 disabled={participant.paymentStatus !== PaymentStatus.PAID}
                 className="bg-primary text-white px-12 py-5 rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-[#144318] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
               >
                 <Download size={22} /> Simpan File PDF
               </button>
               <button 
                 onClick={() => window.print()}
                 disabled={participant.paymentStatus !== PaymentStatus.PAID}
                 className="bg-[#2D3436] text-white px-12 py-5 rounded-2xl font-bold shadow-xl shadow-stone-900/10 flex items-center justify-center gap-3 hover:bg-black hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
               >
                 <Printer size={22} /> Cetak Sekarang
               </button>
            </div>
          </div>
        )}

        {!participant && (
          <div className="text-center py-32 opacity-30">
             <div className="w-24 h-24 bg-white dark:bg-stone-900 rounded-[2rem] flex items-center justify-center mx-auto text-gray-200 border border-gray-100 mb-8">
                <QrCode size={40} />
             </div>
             <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-2xl font-bold tracking-tight text-stone-300">Siap untuk Cetak.</h3>
                <p className="text-sm text-stone-400 font-medium">Input ID Peserta untuk melihat pratinjau kartu modern yang siap dipasang pada hewan qurban.</p>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-only { display: block !important; }
        }
      `}</style>
    </div>
  );
}
