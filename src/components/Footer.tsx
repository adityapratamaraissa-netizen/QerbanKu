import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-stone-900 border-t border-gray-100 dark:border-stone-800 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="space-y-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                <Heart size={20} fill="currentColor" />
              </div>
              <span className="text-2xl font-bold text-[#2D3436] tracking-tight transition-colors">
                Qurban<span className="text-primary italic">Ku.</span>
              </span>
            </Link>
            <p className="text-stone-500 font-medium text-sm leading-relaxed max-w-xs">
              Mewujudkan ibadah qurban yang lebih terorganisir dengan sentuhan teknologi modern dan amanah syari'ah.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-primary hover:bg-accent transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-primary hover:bg-accent transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-primary hover:bg-accent transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Eksplorasi</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Beranda</Link></li>
              <li><Link to="/daftar" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Daftar Qurban</Link></li>
              <li><Link to="/kelompok" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Kelompok Sapi</Link></li>
              <li><Link to="/pembayaran" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Cek Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Bantuan</h4>
            <ul className="space-y-4">
              <li><Link to="/admin" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Panel Panitia</Link></li>
              <li><Link to="/kebijakan" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
              <li><Link to="/syarat" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Syarat & Layanan</Link></li>
              <li><Link to="/kontak" className="text-[#2D3436] font-bold text-sm hover:text-primary transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Sekretariat</h4>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4 text-stone-500 font-medium text-sm">
                <MapPin size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="leading-relaxed">Masjid Miftahul Huda, Lamongan</span>
              </li>
              <li className="flex items-center space-x-4 text-stone-500 font-medium text-sm">
                <Phone size={20} className="text-secondary shrink-0" />
                <span>+62 858-1501-7403</span>
              </li>
              <li className="flex items-center space-x-4 text-stone-500 font-medium text-sm">
                <Mail size={20} className="text-secondary shrink-0" />
                <span>halo@qurbanku.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-50 dark:border-stone-800 flex flex-col md:flex-row justify-between items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest gap-6">
          <p>© 2026 QURBANKU. DIKELOLA OLEH PANITIA MASJID MIFTAHUL HUDA, LAMONGAN.</p>
          <div className="flex gap-8">
            <span className="flex items-center gap-2 italic">DIGITAL PANITIA SYAR'I</span>
            <span className="flex items-center gap-2">PLATFORM MINIMALIS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
