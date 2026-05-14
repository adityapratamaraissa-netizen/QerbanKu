import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, Wallet, Calendar, ShieldCheck, Search, Filter, 
  Download, Edit, Trash2, Check, X, MoreVertical,
  ArrowUpRight, FileText, PieChart as PieChartIcon, Clock, LogIn, LogOut
} from "lucide-react";
import { PaymentStatus, QurbanType } from "../../types";
import { cn } from "../../lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { auth, db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

interface Participant {
  id: string;
  name: string;
  qurbanFor: string;
  whatsapp: string;
  type: QurbanType;
  paymentStatus: PaymentStatus;
  amount: number;
  createdAt: any;
  paymentProofUrl?: string;
  groupId?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [peserta, setPeserta] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminDoc = await getDoc(doc(db, "admins", u.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else if (u.email === "adityapratamaraissa@gmail.com") {
          // Auto bootstrap admin for the requested user
          await setDoc(doc(db, "admins", u.uid), {
            email: u.email,
            role: "SUPER_ADMIN",
            createdAt: serverTimestamp()
          });
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "participants"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as Participant));
      setPeserta(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "participants"));

    const qGroups = query(collection(db, "groups"));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsub();
      unsubGroups();
    };
  }, [isAdmin]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      toast.error("Gagal login: " + (error as any).message);
    }
  };

  const handleLogout = () => signOut(auth);

  const updateStatus = async (id: string, status: PaymentStatus) => {
    try {
      await updateDoc(doc(db, "participants", id), {
        paymentStatus: status,
        updatedAt: serverTimestamp()
      });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `participants/${id}`);
    }
  };

  const filteredPeserta = peserta.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: peserta.length,
    paid: peserta.filter(p => p.paymentStatus === PaymentStatus.PAID).length,
    totalDana: peserta.filter(p => p.paymentStatus === PaymentStatus.PAID).reduce((acc, p) => acc + p.amount, 0),
    sapi: peserta.filter(p => p.type === QurbanType.SAPI).length,
    kambing: peserta.filter(p => p.type === QurbanType.KAMBING).length,
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPeserta);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peserta Qurban");
    XLSX.writeFile(wb, "Data-QurbanKu-2026.xlsx");
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.text("Laporan Data Peserta QurbanKu 2026", 14, 15);
    autoTable(docPdf, {
      startY: 20,
      head: [["ID", "Nama", "Qurban Untuk", "Jenis", "Status", "Nominal"]],
      body: filteredPeserta.map(p => [p.id, p.name, p.qurbanFor, p.type, p.paymentStatus, p.amount.toLocaleString()]),
    });
    docPdf.save("Laporan-QurbanKu-2026.pdf");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <ShieldCheck size={40} />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Akses Khusus Panitia</h1>
          <p className="text-stone-500">Silakan login menggunakan akun terdaftar.</p>
        </div>
        {!user ? (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold active:scale-95 transition-all"
          >
            <LogIn size={20} /> Login Google
          </button>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-500 font-bold">Email {user.email} tidak memiliki akses admin.</p>
            <button onClick={handleLogout} className="text-stone-400 hover:text-stone-600 font-bold">Logout</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7F5] dark:bg-stone-950 min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-200/50 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-12 h-1 bg-primary rounded-full"></span>
              <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Control Center</p>
            </div>
            <h1 className="text-5xl font-bold text-[#2D3436] dark:text-white tracking-tight">Dashboard.</h1>
            <p className="text-stone-500 font-medium">Monitoring data mudhohi dan manajemen transaksi secara terpadu.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right hidden md:block px-6">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logged in as</p>
               <p className="text-sm font-bold text-[#2D3436] tracking-tight">{user?.displayName || "Administrator"}</p>
            </div>
            <button 
              onClick={exportExcel}
              className="px-6 py-4 bg-white dark:bg-stone-800 text-primary border border-primary/5 rounded-2xl font-bold flex items-center gap-2 hover:bg-accent transition-all shadow-sm"
            >
              <FileText size={18} /> <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button onClick={handleLogout} className="p-4 bg-white dark:bg-stone-800 text-stone-400 rounded-2xl hover:text-red-500 transition-all shadow-sm">
                <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Mudhohi", val: stats.total.toString(), trend: "+4 Today", icon: Users, color: "text-[#2D3436]", accent: "bg-[#2D3436]/5" },
            { label: "Verifikasi", val: stats.paid.toString(), trend: "98% Valid", icon: ShieldCheck, color: "text-primary", accent: "bg-primary/5" },
            { label: "Kelompok", val: Math.ceil(stats.sapi/7).toString(), trend: "Lengkap", icon: Calendar, color: "text-secondary", accent: "bg-secondary/5" },
            { label: "Revenue", val: `${(stats.totalDana / 1000000).toFixed(1)}M`, trend: "Total IDR", icon: Wallet, color: "text-indigo-600", accent: "bg-indigo-600/5" }
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-stone-800 group hover:shadow-xl hover:shadow-gray-200/50 transition-all">
               <div className="flex justify-between items-start mb-8">
                  <div className={cn("p-4 rounded-[1.5rem] bg-gray-50 dark:bg-stone-800 group-hover:scale-110 transition-transform", stat.color)}>
                    <stat.icon size={26} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">{stat.trend}</span>
               </div>
               <div className="space-y-1">
                  <h3 className="text-4xl font-bold tracking-tight text-[#2D3436] dark:text-white">{stat.val}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
               </div>
            </div>
          ))}
        </div>

        {/* Main Section */}
        <div className="space-y-8">
          {/* Filters & Search */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-stone-800 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID Registrasi, Nama, atau Lokasi..."
                  className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-gray-50 dark:bg-stone-950 border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto px-2">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-8 py-5 rounded-[2rem] bg-gray-50 dark:bg-stone-950 border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-[#2D3436] appearance-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value={QurbanType.KAMBING}>Perorangan</option>
                  <option value={QurbanType.SAPI}>Patungan</option>
                </select>
                <button className="p-5 bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:bg-[#144318] transition-all">
                  <Filter size={20} />
                </button>
              </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-stone-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-stone-800 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50/50 dark:bg-stone-800/50 text-gray-400 uppercase text-[10px] font-bold tracking-[0.2em] border-b border-gray-100 dark:border-stone-800">
                         <th className="px-10 py-6">Identity</th>
                         <th className="px-6 py-6">Classification</th>
                         <th className="px-6 py-6">Engagement</th>
                         <th className="px-6 py-6">Financial State</th>
                         <th className="px-10 py-6 text-right">Administrative Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-stone-800">
                       {filteredPeserta.map((p) => (
                        <tr key={p.id} className="hover:bg-accent/30 dark:hover:bg-stone-800/20 transition-colors group">
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-stone-800 flex items-center justify-center font-bold text-gray-400 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                                  {p.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-[#2D3436] dark:text-stone-100 text-lg tracking-tight">{p.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{p.id} • FOR: {p.qurbanFor}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-8">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-gray-50 dark:bg-stone-800 rounded-xl flex items-center justify-center text-xl shadow-sm">
                                  {p.type === QurbanType.KAMBING ? "🐑" : "🐄"}
                               </div>
                               <span className="text-sm font-bold text-[#2D3436] tracking-tight">{p.type}</span>
                             </div>
                          </td>
                          <td className="px-6 py-8">
                             <p className="font-mono text-sm font-bold text-stone-500">{p.whatsapp}</p>
                          </td>
                          <td className="px-6 py-8">
                             <div className="space-y-2">
                                <div className={cn(
                                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                  p.paymentStatus === PaymentStatus.PAID ? "bg-primary/10 text-primary" :
                                  p.paymentStatus === PaymentStatus.VERIFYING ? "bg-[#FFF8E1] text-secondary" : "bg-red-50 text-red-700"
                                )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", 
                                    p.paymentStatus === PaymentStatus.PAID ? "bg-primary" :
                                    p.paymentStatus === PaymentStatus.VERIFYING ? "bg-secondary" : "bg-red-500"
                                  )}></div>
                                  {p.paymentStatus}
                                </div>
                                {p.paymentProofUrl && (
                                  <a href={p.paymentProofUrl} target="_blank" rel="noreferrer" className="block text-[10px] text-primary/60 font-bold uppercase hover:underline">Verify Assets</a>
                                )}
                             </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <div className="flex justify-end gap-3">
                                {p.paymentStatus !== PaymentStatus.PAID && (
                                  <button 
                                    onClick={() => updateStatus(p.id, PaymentStatus.PAID)}
                                    className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/10 hover:bg-[#144318] transition-all"
                                    title="Verify & Accept"
                                  >
                                    <Check size={20} />
                                  </button>
                                )}
                                {p.paymentStatus === PaymentStatus.VERIFYING && (
                                  <button 
                                    onClick={() => updateStatus(p.id, PaymentStatus.REJECTED)}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                    title="Reject Assets"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                                   <MoreVertical size={20} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             {filteredPeserta.length === 0 && (
                <div className="py-24 text-center opacity-30">
                   <div className="w-20 h-20 bg-gray-50 dark:bg-stone-800 rounded-[1.5rem] flex items-center justify-center mx-auto text-gray-200 mb-6 border border-gray-100">
                      <Search size={32} />
                   </div>
                   <p className="text-xl font-bold tracking-tight text-[#2D3436]">Query returned no results.</p>
                </div>
             )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-24 border-t border-gray-100 pt-16">
            <div className="bg-white dark:bg-stone-900 p-12 rounded-[3.5rem] shadow-sm border border-gray-100 dark:border-stone-800">
               <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-secondary">
                    <PieChartIcon size={26} />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl tracking-tighter text-[#2D3436]">Classification.</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Distribution statistics</p>
                  </div>
               </div>
               <div className="space-y-10">
                  <div className="group">
                    <div className="flex justify-between text-sm font-bold mb-4">
                       <span className="text-gray-400 uppercase tracking-widest text-[10px]">Patungan Sapi</span>
                       <span className="text-primary">{stats.sapi} Participants</span>
                    </div>
                    <div className="h-4 w-full bg-gray-50 dark:bg-stone-800 rounded-full p-1">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(stats.sapi / (stats.total || 1)) * 100}%` }}
                         className="h-full bg-secondary rounded-full shadow-sm"
                       ></motion.div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="flex justify-between text-sm font-bold mb-4">
                       <span className="text-gray-400 uppercase tracking-widest text-[10px]">Perorangan Kambing</span>
                       <span className="text-primary">{stats.kambing} Participants</span>
                    </div>
                    <div className="h-4 w-full bg-gray-50 dark:bg-stone-800 rounded-full p-1">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(stats.kambing / (stats.total || 1)) * 100}%` }}
                         className="h-full bg-primary rounded-full shadow-sm"
                       ></motion.div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-[#2D3436] p-12 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                   <div className="space-y-4">
                      <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                      <h3 className="font-bold text-3xl tracking-tight">Executive Summary.</h3>
                      <p className="text-white/50 font-medium">Real-time status overview of all transactions.</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6 my-10">
                      <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                         <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2">Verified</p>
                         <p className="text-5xl font-bold tracking-tighter text-primary">{stats.paid}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                         <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2">Pending</p>
                         <p className="text-5xl font-bold tracking-tighter text-secondary">{stats.total - stats.paid}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] pt-6 border-t border-white/10">
                      <ShieldCheck size={16} />
                      CRYPTOGRAPHICALLY SECURED SYSTEM
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
