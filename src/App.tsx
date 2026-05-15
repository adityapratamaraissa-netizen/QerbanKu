/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import AIGuide from "./components/AIGuide";
import InstallPWA from "./components/InstallPWA";
import Home from "./pages/Home";
import Register from "./pages/Register";
import CowGroups from "./pages/CowGroups";
import Dashboard from "./pages/Admin/Dashboard";
import PrintCards from "./pages/PrintCards";
import Payments from "./pages/Payments";
import Participants from "./pages/Participants";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/daftar" element={<Register />} />
            <Route path="/kelompok" element={<CowGroups />} />
            <Route path="/cetak" element={<PrintCards />} />
            <Route path="/pembayaran" element={<Payments />} />
            <Route path="/mudhohi" element={<Participants />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<Dashboard />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppFloat />
        <AIGuide />
        <InstallPWA />
        <Toaster position="top-center" />
      </div>
    </Router>
  );
}
