# Agent Council Mode - Quick Start 🚀

## Setup Cepat (5 Menit)

### 1. Install Dependencies (jika belum)
```bash
npm install
```

### 2. Setup API Keys
Edit `.env` file:

```env
# Minimal - 1 provider (Groq recommended)
VITE_GROQ_API_KEY=gsk_your_key_here

# Opsional - untuk lebih banyak models
VITE_TOGETHER_API_KEY=your_together_key
VITE_OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
```

**Dapatkan API Keys (100% Gratis)**:
- Groq: https://console.groq.com (fastest, unlimited)
- Together: https://api.together.xyz ($25 free credits)
- OpenRouter: https://openrouter.ai ($1-5 free credits)

### 3. Start Dev Server
```bash
npm run dev
```

### 4. Buka Agent Council
1. Klik hamburger menu (☰) di kiri atas
2. Klik tombol "Council" (🏆) di bagian Models
3. Ketik pertanyaan Anda
4. Tekan Enter
5. Tunggu ~20-35 detik untuk deliberasi lengkap

## Cara Kerja (3 Stages)

```
User Question
      ↓
[Stage 1: 5 Models Respond] (~10s)
      ↓
[Stage 2: Peer Ranking] (~15s)
      ↓
[Stage 3: Chairman Synthesis] (~10s)
      ↓
Final Answer + Full Deliberation
```

## Models yang Digunakan (Semua Gratis!)

**Council Members**:
- Llama Scholar (Groq)
- Mixtral Sage (Groq)
- Gemma Analyst (Groq)
- Qwen Expert (Together AI)
- Nemotron Oracle (OpenRouter)

**Chairman**: Qwen3-Next-80B (Together AI)

## Contoh Pertanyaan

✅ **Bagus untuk Agent Council**:
- "Apa pro dan kontra dari menggunakan microservices vs monolith architecture?"
- "Bagaimana cara terbaik untuk optimize React app performance?"
- "Explain quantum computing seperti saya berusia 5 tahun, tapi juga kasih technical details"

❌ **Tidak perlu Agent Council**:
- "What is 2+2?" (too simple)
- "Halo!" (greeting aja)
- Simple fact checking

## Troubleshooting

**Error: "No API keys configured"**
→ Pastikan minimal 1 API key sudah di `.env` dan restart server

**Error: "All models failed"**
→ Check API key valid, ada credit, dan tidak rate limited

**Lambat banget**
→ Normal ~20-35 detik untuk 3 stages. Jika > 1 menit, mungkin overload (coba lagi)

## Dokumentasi Lengkap

Lihat `AGENT_COUNCIL.md` untuk:
- Penjelasan detail setiap stage
- Cara kustomisasi council
- Advanced tips & tricks
- Troubleshooting lengkap
- Future roadmap

---

**Happy Deliberating! 🏛️**

