import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askAI(prompt: string, history: { role: 'user' | 'model', parts: [{ text: string }] }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `Anda adalah "Asisten Kurban Miftahul Huda", asisten digital cerdas yang membantu jamaah Masjid Miftahul Huda Lamongan. 
        Tugas Anda:
        1. Menjawab pertanyaan seputar hukum kurban (Fiqh) sesuai mazhab Syafi'i (populer di Indonesia).
        2. Membantu memilih hewan kurban (Kambing vs Sapi).
        3. Menjelaskan cara kerja platform pendaftaran digital ini.
        4. Memberikan informasi tentang Masjid Miftahul Huda Lamongan.
        5. Selalu gunakan bahasa yang sopan, ramah, dan islami (ada salam, dsb).
        6. Jawab secara ringkas namun jelas. Jika ada pertanyaan teknis soal pembayaran, arahkan untuk menghubungi admin via WhatsApp di nomor +62 858-1501-7403.`,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, asisten AI sedang beristirahat sebentar. Silakan coba lagi nanti atau hubungi admin via WhatsApp.";
  }
}
