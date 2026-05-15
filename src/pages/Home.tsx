import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, Calendar, Wallet, Download, ShieldCheck, Sparkles, Loader2, MessageCircle, HelpCircle, Star, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_CONFIG } from "../constants";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import LiveActivityTicker from "../components/LiveActivityTicker";
import AIGuide from "../components/AIGuide";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [stats, setStats] = useState({ participants: 0, sapi: 0, loading: true });

  useEffect(() => {
    // Real-time stats from Firestore
    const unsubParticipants = onSnapshot(collection(db, "participants"), (snap) => {
      setStats(prev => ({ ...prev, participants: snap.size, loading: false }));
    });

    const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
      setStats(prev => ({ ...prev, sapi: snap.size }));
    });

    const timer = setInterval(() => {
      const eid = new Date(APP_CONFIG.eidAlAdhaDate);
      const now = new Date();
      if (eid > now) {
        setTimeLeft({
          days: differenceInDays(eid, now),
          hours: differenceInHours(eid, now) % 24,
          minutes: differenceInMinutes(eid, now) % 60,
          seconds: differenceInSeconds(eid, now) % 60
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-pattern min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 text-left space-y-10 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4">
                <LiveActivityTicker />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-1 bg-primary rounded-full"></div>
                  <span className="text-[11px] font-bold text-primary tracking-[0.3em] uppercase mb-1">
                    Digital Syar'i Experience #1
                  </span>
                </div>
              </div>
              <h1 className="text-6xl lg:text-9xl font-bold text-[#2D3436] leading-[0.9] tracking-tighter">
                Ibadah Qurban <br />
                <span className="text-secondary font-serif italic font-medium">Lebih Bermakna.</span>
              </h1>
              <p className="text-xl text-stone-500 max-w-xl leading-relaxed font-normal border-l-4 border-accent pl-6 py-2">
                Revolusi manajemen Qurban digital di <span className="font-bold text-primary">Masjid Miftahul Huda Lamongan</span>. Transparan, amanah, dan terorganisir sempurna.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/daftar"
                className="bg-primary text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20 hover:bg-[#144318] hover:translate-y-[-2px] transition-all flex items-center group"
              >
                Mulai Daftar
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/kelompok"
                className="bg-white text-[#2D3436] px-10 py-5 rounded-2xl font-bold text-lg shadow-sm border border-gray-100 hover:bg-stone-50 transition-all"
              >
                Kelompok Sapi
              </Link>
            </motion.div>
          </div>

          <div className="lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-stone-200/50 border border-gray-100 relative z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-30 rounded-bl-full translate-x-10 -translate-y-10"></div>
                <div className="flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress Kolektif</p>
                      <h4 className="text-2xl font-bold text-[#2D3436]">Miftahul Huda</h4>
                    </div>
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-primary">
                      <Users size={24} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/mudhohi" className="p-4 bg-stone-50 rounded-2xl border border-gray-100 hover:bg-stone-100 transition-all">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Peserta</p>
                      <p className="text-2xl font-bold text-primary">{stats.loading ? "..." : stats.participants}</p>
                    </Link>
                    <Link to="/kelompok" className="p-4 bg-stone-50 rounded-2xl border border-gray-100 hover:bg-stone-100 transition-all">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sapi</p>
                      <p className="text-2xl font-bold text-secondary">{stats.loading ? "..." : stats.sapi}</p>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight">
                      <span className="text-gray-400">Target Distribusi</span>
                      <span className="text-primary">85% Terpenuhi</span>
                    </div>
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-primary rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary opacity-5 rounded-full blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-secondary font-bold text-xs uppercase tracking-[0.3em]">The Challenge</span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#2D3436] tracking-tight">Kenapa Harus <br />Digital-First?</h2>
            </div>
            <div className="space-y-6">
              {[
                { prob: "Manajemen Manual", sol: "Otomasi sistem patungan & pendaftaran.", icon: ShieldCheck },
                { prob: "Kurang Transparansi", sol: "Live dashboard pantau status iuran.", icon: Users },
                { prob: "Data Tercecer", sol: "Log data aman & terintegrasi cloud.", icon: Download }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-6 items-start"
                >
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-red-400 group hover:text-primary transition-colors">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold text-sm line-through opacity-50 mb-1">{item.prob}</h4>
                    <p className="text-[#2D3436] font-bold text-lg">{item.sol}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary to-primary-light rounded-[3rem] p-12 text-white flex flex-col justify-end overflow-hidden shadow-2xl">
              <div className="absolute top-12 right-12 opacity-10">
                <ShieldCheck size={200} />
              </div>
              <div className="space-y-4 relative z-10">
                <span className="text-secondary font-bold tracking-widest text-xs uppercase">Value Proposition</span>
                <p className="text-3xl font-serif italic tracking-tight leading-snug">
                  "Menghadirkan rasa tenang bagi Mudhohi melalui transparansi digital yang belum pernah ada sebelumnya."
                </p>
                <div className="w-12 h-1 bg-secondary rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-24 bg-[#1B5E20] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 text-center space-y-12 relative z-10">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Waktu Tersisa</p>
            <h2 className="text-4xl font-bold tracking-tight">Menuju Idul Adha 1447H</h2>
          </div>
          <div className="flex justify-center gap-4 md:gap-8">
            {[
              { label: "Hari", value: timeLeft.days },
              { label: "Jam", value: timeLeft.hours },
              { label: "Menit", value: timeLeft.minutes },
              { label: "Detik", value: timeLeft.seconds }
            ].map((unit) => (
              <div key={unit.label} className="group">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-white/5 backdrop-blur-sm rounded-3xl flex items-center justify-center text-3xl md:text-5xl font-bold border border-white/10 group-hover:bg-white/10 transition-all">
                  {unit.value.toString().padStart(2, "0")}
                </div>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-4 block opacity-50">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <span className="text-secondary font-bold text-xs uppercase tracking-widest">Suara Mudhohi</span>
            <h2 className="text-5xl font-bold text-[#2D3436] tracking-tight">Apa Kata Mereka?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: "H. Ahmad Sutedjo", 
                role: "Jamaah Tetap", 
                text: "Sistem patungan sapi digital ini sangat membantu. Saya bisa pantau progres kelompok saya secara real-time. Sangat transparan!",
                stars: 5 
              },
              { 
                name: "Ibu Siti Marwah", 
                role: "Mudhohi Baru", 
                text: "Daftarnya gampang banget, tinggal lewat HP. Bukti bayar diupload langsung diverifikasi panitia. Luar biasa inovasinya.",
                stars: 5 
              },
              { 
                name: "Bpk. Budi Santoso", 
                role: "Donatur", 
                text: "Label kurban yang dicetak otomatis bikin pembagian daging jadi lebih teratur. Nggak ada lagi rebutan atau data dobel.",
                stars: 5 
              }
            ].map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 text-amber-400 mb-6">
                    {[...Array(t.stars)].map((_, idx) => <Star key={idx} size={16} fill="currentColor" />)}
                  </div>
                  <Quote className="text-primary/10 mb-4" size={40} />
                  <p className="text-stone-600 font-medium leading-relaxed italic mb-8">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2D3436]">{t.name}</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Bantuan</span>
            <h2 className="text-5xl font-bold text-[#2D3436] tracking-tight">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Bagaimana sistem patungan sapi bekerja?", a: "Satu ekor sapi akan dibagi untuk 7 orang peserta. Jika Anda mendaftar Sapi Kolektif, sistem akan otomatis memasukkan Anda ke dalam kelompok yang masih tersedia kapasitasnya." },
              { q: "Apakah qurban digital ini syah secara syar'i?", a: "Tentu. Sistem kami hanya alat bantu administrasi. Proses pemilihan hewan, penyembelihan, dan distribusi tetap dilakukan secara fisik oleh panitia ahli sesuai tuntunan Sunnah." },
              { q: "Bagaimana jika kelompok sapi tidak terpenuhi 7 orang?", a: "Jika hingga hari H kelompok belum penuh, panitia akan berkoordinasi dengan peserta untuk mencarikan solusi terbaik (pengalihan ke kambing atau penggabungan kelompok)." },
              { q: "Kapan batas akhir pendaftaran qurban?", a: "Pendaftaran ditutup H-3 Idul Adha atau saat kuota hewan sudah terpenuhi." }
            ].map((faq, i) => (
              <details key={i} className="group border border-stone-100 rounded-2xl bg-stone-50 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none list-inside font-bold text-lg text-[#2D3436] hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <HelpCircle className="text-primary" size={20} />
                    {faq.q}
                  </div>
                  <ArrowRight className="rotate-90 group-open:-rotate-90 transition-transform" size={20} />
                </summary>
                <div className="p-6 pt-2 text-stone-500 font-medium leading-relaxed border-t border-stone-100">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Animal Catalog Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <span className="text-secondary font-bold text-xs uppercase tracking-widest">Pilihan Terbaik</span>
              <h2 className="text-5xl font-bold text-[#2D3436] tracking-tight">Hewan Qurban <br />Kualitas Super.</h2>
            </div>
            <p className="text-stone-500 max-w-md leading-relaxed">Semua hewan telah melewati seleksi kesehatan ketat oleh tim ahli dan bersertifikat ASUH (Aman, Sehat, Utuh, Halal).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Sapi Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-[3rem] bg-stone-50 border border-stone-100"
            >
              <div className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-bold text-[#2D3436]">Sapi Limousin</h3>
                    <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Kolektif 7 Orang</p>
                  </div>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap">
                    Best Value
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Per Orang</span>
                  <p className="text-5xl font-bold text-primary">Rp 3,8 Juta</p>
                </div>
                <ul className="space-y-4 pt-6 border-t border-stone-200">
                  <li className="flex items-center gap-3 text-stone-600 font-medium">
                    <CheckCircle2 className="text-primary" size={18} /> Bobot Estimasi: 400-500kg
                  </li>
                  <li className="flex items-center gap-3 text-stone-600 font-medium">
                    <CheckCircle2 className="text-primary" size={18} /> Sehat & Bebas PMK
                  </li>
                  <li className="flex items-center gap-3 text-stone-600 font-medium">
                    <CheckCircle2 className="text-primary" size={18} /> Termasuk Biaya Potong
                  </li>
                </ul>
                <Link to="/daftar" className="block w-full py-5 bg-white text-primary text-center rounded-2xl font-bold border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  Pilih Kolektif Sapi
                </Link>
              </div>
            </motion.div>

            {/* Kambing Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative overflow-hidden rounded-[3rem] bg-primary text-white"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-10 -translate-y-10"></div>
              <div className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-bold">Kambing Etawa</h3>
                    <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Kurban Individu</p>
                  </div>
                  <span className="bg-secondary text-primary px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap">
                    Recommended
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase">Per Ekor</span>
                  <p className="text-5xl font-bold">Rp 3,5 Juta</p>
                </div>
                <ul className="space-y-4 pt-6 border-t border-white/20">
                  <li className="flex items-center gap-3 text-white/80 font-medium">
                    <CheckCircle2 className="text-secondary" size={18} /> Bobot Estimasi: 35-45kg
                  </li>
                  <li className="flex items-center gap-3 text-white/80 font-medium">
                    <CheckCircle2 className="text-secondary" size={18} /> Usia Cukup Syar'i (2+ Thn)
                  </li>
                  <li className="flex items-center gap-3 text-white/80 font-medium">
                    <CheckCircle2 className="text-secondary" size={18} /> Antar Gratis (Radius 5km)
                  </li>
                </ul>
                <Link to="/daftar" className="block w-full py-5 bg-white text-primary text-center rounded-2xl font-bold hover:bg-stone-50 transition-all shadow-lg">
                  Pilih Kambing Personal
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <span className="text-primary font-bold text-xs uppercase tracking-widest">Keunggulan Sistem</span>
              <h2 className="text-5xl font-bold text-[#2D3436] tracking-tight">Qurban Lebih <br />Profesional.</h2>
            </div>
            <p className="text-stone-500 max-w-md leading-relaxed">Kami menggabungkan niat tulus dengan efisiensi teknologi untuk mewujudkan manajemen qurban yang transparan.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: "Grouping Otomatis", desc: "Sistem cerdas yang mengelompokkan patungan sapi secara real-time.", icon: Users, color: "bg-accent text-primary" },
              { title: "AI Consultant", desc: "Asisten cerdas berbasis Gemini untuk tanya jawab seputar fiqh kurban.", icon: Sparkles, color: "bg-purple-50 text-purple-600" },
              { title: "Dashboard Admin", desc: "Kontrol penuh bagi panitia untuk verifikasi dan laporan keuangan.", icon: Wallet, color: "bg-[#FFF8E1] text-[#C5A059]" },
              { title: "Cetak Kartu QR", desc: "Label hewan qurban otomatis dengan identitas digital yang unik.", icon: Download, color: "bg-blue-50 text-blue-600" }
            ].map((feature, idx) => (
              <motion.div 
                key={feature.title} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-stone-200/50 transition-all group bg-white"
              >
                <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-stone-500 leading-relaxed font-normal text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 max-w-7xl mx-auto px-4">
        <div className="bg-[#1B5E20] rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl"></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-2xl mx-auto space-y-10"
          >
            <h2 className="text-5xl font-bold tracking-tight">
              {stats.participants > 0 
                ? `Bergabung Bersama ${stats.participants}+ Mudhohi Tahun Ini.`
                : "Jadilah Mudhohi Pertama Tahun Ini."}
            </h2>
            <p className="text-xl text-white/70 font-medium">Jangan lewatkan kesempatan untuk beribadah dengan cara yang paling terorganisir.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/daftar" className="bg-white text-primary px-12 py-5 rounded-2xl font-bold text-lg hover:bg-stone-50 transition-all shadow-2xl">
                Ayo Daftar Sekarang
              </Link>
              <Link to="/mudhohi" className="bg-white/10 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 border border-white/10 transition-all">
                Daftar Mudhohi
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
