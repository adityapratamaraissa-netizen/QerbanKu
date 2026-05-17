import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Phone, MapPin, Upload, Info, Heart, Check, QrCode, ArrowRight, ArrowLeft, CheckCircle2, Wallet, Users, Download, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { QurbanType, PaymentStatus } from "../types";
import { APP_CONFIG } from "../constants";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import { db, storage, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, doc, setDoc, query, where, getDocs, runTransaction, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Register() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<QurbanType | null>(null);
  const [registeredData, setRegisteredData] = useState<{ id: string; groupName?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    qurbanFor: "",
    whatsapp: "",
    address: "",
    paymentProof: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bsi' | 'dana' | 'gopay'>('bsi');

  const PAYMENT_METHODS = [
    { id: 'bsi', name: 'Bank BSI', number: '7123456789', owner: 'Panitia Qurban 1447H', color: 'text-primary' },
    { id: 'dana', name: 'DANA', number: '085815017403', owner: 'Kurban AI Official', color: 'text-blue-500' },
    { id: 'gopay', name: 'GoPay', number: '085815017403', owner: 'Kurban AI Official', color: 'text-emerald-500' },
  ];

  const handleTypeSelect = (type: QurbanType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, paymentProof: e.target.files![0] }));
    }
  };

  const generateId = () => {
    return `Q-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.qurbanFor || !formData.whatsapp || !selectedType) {
      toast.error("Mohon lengkapi data wajib.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Memproses pendaftaran...");
    const participantId = generateId();
    let paymentProofUrl = null;

    try {
      const amount = selectedType === QurbanType.KAMBING ? APP_CONFIG.kambingPrice : APP_CONFIG.sapiJointPrice;
      console.log("Starting registration process for:", participantId);

      // 1. Upload proof if exists
      if (formData.paymentProof) {
        toast.loading("Mengunggah bukti bayar...", { id: loadingToast });
        console.log("Uploading proof...");
        const storageRef = ref(storage, `proofs/${participantId}_${formData.paymentProof.name}`);
        try {
          const snapshot = await uploadBytes(storageRef, formData.paymentProof);
          paymentProofUrl = await getDownloadURL(snapshot.ref);
          console.log("Proof uploaded:", paymentProofUrl);
        } catch (storageErr) {
          console.error("Storage Error:", storageErr);
          toast.error("Gagal mengunggah bukti bayar, tapi pendaftaran dilanjutkan...");
        }
      }

      toast.loading("Menyimpan ke database...", { id: loadingToast });

      let finalGroupName = "";

      if (selectedType === QurbanType.KAMBING) {
        console.log("Saving Kambing data...");
        const participantData = {
          id: participantId,
          name: formData.name,
          qurbanFor: formData.qurbanFor,
          whatsapp: formData.whatsapp,
          address: formData.address,
          paymentProofUrl,
          paymentMethod,
          type: selectedType,
          amount,
          paymentStatus: paymentProofUrl ? PaymentStatus.VERIFYING : PaymentStatus.PENDING,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, "participants", participantId), participantData);
        finalGroupName = "KAMBING";
      } else {
        console.log("Starting Sapi Joint transaction...");
        // SAPI Grouping Logic
        // 1. Find the target group OUTSIDE the transaction
        const groupsRef = collection(db, "groups");
        // Remove orderBy for reliability on first usage
        const availableGroupQuery = query(groupsRef, where("isFull", "==", false), limit(1));
        const availableGroupSnapshot = await getDocs(availableGroupQuery);
        
        let targetGroupId: string | null = null;
        if (!availableGroupSnapshot.empty) {
          targetGroupId = availableGroupSnapshot.docs[0].id;
        }

        // 2. Prepare the fallback group number OUTSIDE the transaction
        const lastGroupsQuery = query(groupsRef, orderBy("groupNumber", "desc"), limit(1));
        const lastGroupsSnapshot = await getDocs(lastGroupsQuery);
        const nextGroupNumber = lastGroupsSnapshot.empty ? 1 : lastGroupsSnapshot.docs[0].data().groupNumber + 1;

        await runTransaction(db, async (transaction) => {
          let groupId: string;
          let groupNumber: number;
          let participantIds: string[] = [];
          let participantNames: string[] = [];
          let currentTotalAmount = 0;

          if (targetGroupId) {
             const groupDocRef = doc(db, "groups", targetGroupId);
             const groupDoc = await transaction.get(groupDocRef);
             
             if (groupDoc.exists() && !groupDoc.data().isFull) {
                // Use the existing group
                groupId = groupDoc.id;
                groupNumber = groupDoc.data().groupNumber;
                participantIds = [...groupDoc.data().participantIds, participantId];
                participantNames = [...(groupDoc.data().participantNames || []), formData.name];
                currentTotalAmount = groupDoc.data().totalAmount || 0;

                const isFull = participantIds.length >= 7;
                transaction.update(groupDocRef, {
                  participantIds,
                  participantNames,
                  isFull,
                  totalAmount: currentTotalAmount + amount,
                  updatedAt: serverTimestamp()
                });
             } else {
                // Fallback to new group if the targeted one was filled in the split second
                // Check if the fallback groupId exists
                groupId = `group-${nextGroupNumber}`;
                const fallbackDocRef = doc(db, "groups", groupId);
                const fallbackDoc = await transaction.get(fallbackDocRef);
                
                if (fallbackDoc.exists()) {
                  // If it already exists, we should probably try next-next, but for simplicity we'll just throw and let retry
                  throw new Error("Group conflict, retrying...");
                }

                groupNumber = nextGroupNumber;
                participantIds = [participantId];
                participantNames = [formData.name];
                
                transaction.set(fallbackDocRef, {
                  id: groupId,
                  groupNumber,
                  type: "SAPI",
                  participantIds,
                  participantNames,
                  isFull: false,
                  totalAmount: amount,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
             }
          } else {
            // Create new group
            groupId = `group-${nextGroupNumber}`;
            const newGroupDocRef = doc(db, "groups", groupId);
            const newGroupDoc = await transaction.get(newGroupDocRef);
            
            if (newGroupDoc.exists()) {
               throw new Error("Group already exists, retrying...");
            }

            groupNumber = nextGroupNumber;
            participantIds = [participantId];
            participantNames = [formData.name];
            
            transaction.set(newGroupDocRef, {
              id: groupId,
              groupNumber,
              type: "SAPI",
              participantIds,
              participantNames,
              isFull: false,
              totalAmount: amount,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }

          const participantData = {
            id: participantId,
            name: formData.name,
            qurbanFor: formData.qurbanFor,
            whatsapp: formData.whatsapp,
            address: formData.address,
            paymentProofUrl,
            paymentMethod,
            type: selectedType,
            groupId,
            slotNumber: participantIds.length,
            amount,
            paymentStatus: paymentProofUrl ? PaymentStatus.VERIFYING : PaymentStatus.PENDING,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          transaction.set(doc(db, "participants", participantId), participantData);
          finalGroupName = `SAPI #${groupNumber}`;
        });
      }

      setRegisteredData({ id: participantId, groupName: finalGroupName });
      setStep(3);
      toast.success("Pendaftaran berhasil!", { id: loadingToast });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Gagal menyimpan data. Silakan coba lagi.", { id: loadingToast });
      handleFirestoreError(error, OperationType.WRITE, "participants");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F4F7F5] dark:bg-stone-950 min-h-screen py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-1 bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Registrasi Digital</span>
            <div className="w-10 h-1 bg-primary rounded-full"></div>
          </div>
          <h1 className="text-5xl font-bold text-[#2D3436] dark:text-white tracking-tight">Daftar Qurban.</h1>
          <p className="text-stone-500 max-w-md mx-auto font-medium">Lengkapi data Anda untuk memulai ibadah qurban yang terorganisir.</p>
          
          {/* Progress Bar */}
          <div className="flex justify-center items-center gap-6 max-w-xs mx-auto pt-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center flex-1 relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2 z-10",
                  step >= s ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" : "bg-white dark:bg-stone-900 border-gray-100 dark:border-stone-800 text-stone-300"
                )}>
                  {step > s ? <Check size={18} /> : <span className="text-sm">{s}</span>}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "absolute left-[60%] top-1/2 w-full h-[2px] -translate-y-1/2",
                    step > s ? "bg-primary" : "bg-gray-100"
                  )}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <button
                onClick={() => handleTypeSelect(QurbanType.KAMBING)}
                className="group relative bg-white dark:bg-stone-900 p-10 rounded-3xl border border-gray-100 dark:border-stone-800 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all text-left space-y-8"
              >
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🐑</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-[#2D3436] dark:text-white tracking-tight">Kambing</h3>
                  <p className="text-stone-500 font-medium">Satu ekor kambing pilihan untuk qurban perorangan.</p>
                </div>
                <div className="pt-8 border-t border-gray-50 dark:border-stone-800 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-1">Infaq</p>
                    <p className="text-2xl font-bold text-primary">Rp {APP_CONFIG.kambingPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect(QurbanType.SAPI)}
                className="group relative bg-white dark:bg-stone-900 p-10 rounded-3xl border border-gray-100 dark:border-stone-800 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all text-left space-y-8"
              >
                <div className="w-16 h-16 bg-[#FFF8E1] rounded-2xl flex items-center justify-center text-[#C5A059] group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🐄</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-[#2D3436] dark:text-white tracking-tight">Sapi</h3>
                  <p className="text-stone-500 font-medium">Patungan satu ekor sapi untuk kelompok 7 orang.</p>
                </div>
                <div className="pt-8 border-t border-gray-50 dark:border-stone-800 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-1">Patungan</p>
                    <p className="text-2xl font-bold text-secondary">Rp {APP_CONFIG.sapiJointPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary text-white p-3 rounded-xl shadow-lg shadow-secondary/20 group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={20} />
                  </div>
                </div>
                <div className="absolute -top-3 right-8">
                  <span className="bg-secondary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-secondary/20">Populer</span>
                </div>
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[3rem] shadow-sm border border-gray-100 dark:border-stone-800"
            >
              <div className="flex items-center gap-6 mb-12">
                <button 
                  onClick={() => setStep(1)} 
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-stone-800 rounded-full transition-all border border-gray-100 dark:border-stone-800"
                >
                  <ArrowLeft size={24} className="text-gray-400" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#2D3436]">Detail Peserta.</h2>
                  <p className="text-sm text-stone-500 font-medium">Lengkapi informasi untuk {selectedType === QurbanType.KAMBING ? "Qurban Kambing" : "Patungan Sapi"}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Contoh: Bp. Ahmad Subarjo"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">Niat Qurban Untuk</label>
                    <div className="relative">
                      <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        name="qurbanFor"
                        required
                        value={formData.qurbanFor}
                        onChange={handleInputChange}
                        placeholder="Contoh: Keluarga Ahmad"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">Nomor WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        name="whatsapp"
                        required
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="0858-1501-7403"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">Domisili / Alamat</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Kota / Kabupaten"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 dark:bg-stone-950 rounded-3xl border border-gray-100 dark:border-stone-800 space-y-8">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                    <h3 className="text-lg font-bold text-[#2D3436]">Metode Pembayaran</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all text-left",
                          paymentMethod === method.id 
                            ? "bg-white border-primary shadow-md ring-1 ring-primary" 
                            : "bg-gray-50 border-gray-100 dark:bg-stone-900 dark:border-stone-800 opacity-60"
                        )}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{method.name}</p>
                        <p className={cn("font-bold text-base truncate", method.color)}>{method.number}</p>
                        <p className="text-[10px] text-stone-500 font-medium truncate">an. {method.owner}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-primary rounded-2xl flex flex-col justify-center">
                      <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest mb-1">Total Infaq</p>
                      <p className="font-bold text-2xl text-white">
                        Rp {selectedType === QurbanType.KAMBING ? APP_CONFIG.kambingPrice.toLocaleString() : APP_CONFIG.sapiJointPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-8 border-t border-white/50 dark:border-stone-800">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Upload size={14} /> Bukti Transfer (Opsional)
                    </label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-stone-800 rounded-3xl bg-white dark:bg-stone-900 group-hover:border-primary group-hover:bg-accent/10 transition-all">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={24} className="text-gray-400 group-hover:text-primary" />
                        </div>
                        <p className="text-sm text-stone-500 font-bold">{formData.paymentProof ? formData.paymentProof.name : "Klik untuk pilih file bukti bayar"}</p>
                        <p className="text-xs text-gray-300 mt-1 uppercase font-bold tracking-[0.2em]">Format: JPG, PNG (Max 5MB)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF8E1] p-6 rounded-2xl flex items-start gap-4 border border-[#C5A059]/10">
                  <Info size={20} className="text-secondary shrink-0 mt-0.5" />
                  <p className="text-sm text-[#C5A059] font-medium leading-relaxed">
                    Peserta yang sudah upload bukti bayar akan mendapat status <span className="font-bold underline">Verifikasi</span> lebih cepat. Anda juga bisa bayar nanti dan konfirmasi via Dashboard.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-6 rounded-2xl font-bold text-lg text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4",
                    isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-primary shadow-primary/20 hover:bg-[#144318] hover:translate-y-[-2px]"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Menyimpan Data...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan & Selesaikan</span>
                      <ArrowRight size={22} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-stone-900 p-16 rounded-[4rem] shadow-sm border border-gray-100 dark:border-stone-800 text-center max-w-2xl mx-auto"
            >
              <div className="w-24 h-24 bg-accent text-primary rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Check size={48} strokeWidth={3} />
              </div>
              <h2 className="text-4xl font-bold mb-4 text-[#2D3436] tracking-tight">Terima Kasih.</h2>
              <p className="text-stone-500 font-medium text-lg mb-8 leading-relaxed">
                Pendaftaran Anda telah kami terima.
              </p>

              {/* Enhanced Status Indicator */}
              <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-3xl border border-stone-100 mb-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-secondary">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Verifikasi</p>
                    <p className="text-sm font-bold text-secondary">Sedang Diproses oleh Panitia</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Verifying</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="p-8 bg-gray-50 dark:bg-stone-950 rounded-3xl border border-gray-100 dark:border-stone-800 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-5 rounded-bl-3xl"></div>
                  <QrCode size={40} className="mb-4 text-primary opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">ID Peserta</p>
                  <p className="text-2xl font-bold font-mono tracking-tighter text-[#2D3436]">{registeredData?.id || "---"}</p>
                </div>
                <div className="p-8 bg-gray-50 dark:bg-stone-950 rounded-3xl border border-gray-100 dark:border-stone-800 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-secondary opacity-5 rounded-bl-3xl"></div>
                  <Users size={40} className="mb-4 text-secondary opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Kelompok</p>
                  <p className="text-2xl font-bold font-mono tracking-tighter text-secondary">{registeredData?.groupName || (selectedType === QurbanType.KAMBING ? "KAMBING" : "---")}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Link to="/cetak" className="w-full bg-primary text-white py-5 rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-[#144318] transition-all">
                  <Download size={20} /> Cetak & Cek Status
                </Link>
                <Link to="/" className="w-full py-5 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                  Kembali ke Beranda
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

