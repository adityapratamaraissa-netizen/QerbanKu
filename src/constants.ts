import { QurbanConfig } from "./types";

export const APP_CONFIG: QurbanConfig = {
  kambingPrice: 3500000,
  sapiJointPrice: 3800000, // Per person for 1/7 cow
  eidAlAdhaDate: "2026-05-27T00:00:00Z" // Updated to 27 May as requested
};

export const NAV_LINKS = [
  { name: "Beranda", href: "/" },
  { name: "Daftar Qurban", href: "/daftar" },
  { name: "Kelompok Sapi", href: "/kelompok" },
  { name: "Pembayaran", href: "/pembayaran" },
  { name: "Cetak Kartu", href: "/cetak" },
  { name: "Daftar Mudhohi", href: "/mudhohi" },
  { name: "Kontak", href: "/kontak" }
];

export const ADMIN_NAV_LINKS = [
  { name: "Dashboard", href: "/admin" },
  { name: "Semua Peserta", href: "/admin/peserta" },
  { name: "Laporan", href: "/admin/laporan" }
];
