# Agent Council Mode 🏛️

Agent Council Mode adalah sistem kolaborasi AI 3-tahap yang menggunakan multiple LLM models untuk memberikan jawaban terbaik melalui deliberasi dan peer review.

## 🎯 Cara Kerja

### Stage 1: Individual Responses
Semua anggota council (5 models) memberikan respons individual terhadap pertanyaan Anda secara parallel:
- **Llama Scholar** (Groq - llama-3.1-8b-instant)
- **Mixtral Sage** (Groq - mixtral-8x7b-32768)
- **Gemma Analyst** (Groq - gemma2-9b-it)
- **Qwen Expert** (Together AI - Qwen3-Next-80B)
- **Nemotron Oracle** (OpenRouter - nvidia/nemotron-nano-12b-v2-vl:free)

### Stage 2: Peer Review & Ranking
Setiap model menerima semua respons (dianonimkan sebagai Response A, B, C, dst) dan memberikan ranking berdasarkan kualitas. Model akan:
1. Mengevaluasi setiap respons
2. Menjelaskan kelebihan dan kekurangan masing-masing
3. Memberikan ranking final dari terbaik ke terburuk

### Stage 3: Chairman Synthesis
Chairman (Qwen3-Next-80B) menganalisis:
- Semua respons individual dari Stage 1
- Semua peer rankings dari Stage 2
- Pola agreement/disagreement antar models

Kemudian mensintesis semuanya menjadi satu jawaban final yang komprehensif dan akurat.

## 💡 Keunggulan

1. **Diverse Perspectives**: Menggunakan berbagai model dengan arsitektur berbeda
2. **Peer Review**: Mengurangi bias individual model melalui voting
3. **Quality Synthesis**: Chairman menghasilkan jawaban terbaik dari collective wisdom
4. **Transparency**: Anda bisa melihat semua tahapan proses dan reasoning
5. **100% Free**: Menggunakan model-model gratis dari Groq, Together AI, dan OpenRouter

## 🚀 Cara Menggunakan

### 1. Setup API Keys

Edit file `.env` di root project:

```env
# Groq (3 models) - WAJIB
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Together AI (1 model) - OPSIONAL tapi direkomendasikan
VITE_TOGETHER_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# OpenRouter (1 model) - OPSIONAL
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
```

**Note**: 
- Minimal harus ada 1 provider (recommend Groq karena gratis dan cepat)
- Semakin banyak provider, semakin diverse perspektif council
- Semua model yang digunakan adalah **FREE TIER**

### 2. Mendapatkan API Keys

#### Groq (Recommended - Fastest & Free)
1. Kunjungi: https://console.groq.com
2. Sign up gratis
3. Buat API key di dashboard
4. Copy dan paste ke `.env`

#### Together AI (Optional - Better Models)
1. Kunjungi: https://api.together.xyz
2. Sign up gratis
3. Dapat $25 free credit untuk new users
4. Copy API key ke `.env`

#### OpenRouter (Optional - Vision Capable)
1. Kunjungi: https://openrouter.ai
2. Sign up gratis
3. Dapat $1-5 free credit
4. Copy API key ke `.env`

### 3. Start Development Server

```bash
npm run dev
```

### 4. Open Agent Council Mode

Ada 3 cara:

**Cara 1**: Dari Sidebar (hamburger menu)
- Klik icon hamburger (☰) di kiri atas
- Scroll ke bawah bagian "Models"
- Klik tombol "Council" (icon trophy 🏆)

**Cara 2**: Dari Settings
- Klik icon settings (⚙️) di kanan atas
- Di bagian "Special Modes"
- Klik "Agent Council Mode"

**Cara 3**: Keyboard Shortcut (coming soon)
- Ctrl/Cmd + Shift + C

### 5. Tanyakan Sesuatu!

Ketik pertanyaan Anda dan tekan Enter. Council akan:
1. ⚡ Stage 1: Collect responses (~5-10 detik)
2. 🔍 Stage 2: Peer review & ranking (~10-15 detik)
3. 🏆 Stage 3: Chairman synthesis (~5-10 detik)

**Total waktu**: ~20-35 detik untuk satu deliberasi lengkap

## 📊 Membaca Hasil

### Tab Rankings
Melihat aggregate rankings dari semua peer reviews:
- #1, #2, #3 = Model dengan ranking terbaik
- Average Rank = Rata-rata posisi dari semua voting
- Lower is better (1.0 = selalu di posisi pertama)

### Tab Stage 1
Melihat respons individual dari setiap model:
- Full response dari masing-masing council member
- Bisa bandingkan approach dan reasoning mereka

### Tab Stage 2
Melihat peer review lengkap:
- Evaluasi detail dari setiap model
- Reasoning kenapa mereka ranking response tertentu
- Pattern agreement/disagreement

### Final Answer (Ditampilkan Pertama)
Sintesis chairman yang sudah mempertimbangkan:
- Kualitas setiap response
- Consensus dari peer reviews
- Diverse perspectives

## 🎨 Kapan Menggunakan Agent Council?

### ✅ Cocok Untuk:
- **Complex Questions**: Pertanyaan yang butuh analisis mendalam
- **Controversial Topics**: Isu yang memerlukan multiple perspectives
- **Critical Decisions**: Keputusan penting yang butuh validasi
- **Research**: Mencari jawaban paling komprehensif dan akurat
- **Code Review**: Multiple AI reviewing code dari sudut pandang berbeda

### ❌ Tidak Cocok Untuk:
- **Simple Questions**: "What is 2+2?" (terlalu overkill)
- **Quick Queries**: Pertanyaan cepat yang butuh jawaban instant
- **Creative Writing**: Lebih baik gunakan single model untuk konsistensi
- **Rate-Limited Situations**: Council consume banyak API calls

## 🔧 Kustomisasi Council

### Mengubah Council Members

Edit file `src/lib/agentCouncil.ts`:

```typescript
export const COUNCIL_MEMBERS: CouncilMember[] = [
    {
        name: "Your Custom Model",
        provider: "groq", // atau "together" atau "openrouter"
        modelId: "model-id-here",
    },
    // ... tambah member lain
];
```

### Mengubah Chairman

```typescript
export const CHAIRMAN: CouncilMember = {
    name: "Your Chairman",
    provider: "together",
    modelId: "your-best-model-id",
};
```

**Tips**:
- Gunakan model tercepat untuk council members (responsiveness)
- Gunakan model terkuat untuk chairman (quality)
- Ideal: 3-7 members (terlalu sedikit = kurang diverse, terlalu banyak = lambat)

## 🐛 Troubleshooting

### "No API keys configured"
- Pastikan minimal 1 provider sudah dikonfigurasi di `.env`
- Restart dev server setelah edit `.env`
- Check console log untuk memastikan key loaded

### "All models failed to respond"
- Check API key masih valid
- Check credit balance di provider
- Check rate limits (wait beberapa menit)
- Check internet connection

### Council sangat lambat
- Normal untuk 3-stage process (~20-35 detik)
- Jika > 1 menit, kemungkinan:
  - Model overloaded (coba lagi nanti)
  - Network lambat
  - Too many concurrent users di free tier

### Ranking tidak masuk akal
- Models occasionally fail to follow ranking format
- Parser akan extract best-effort dari response
- Tidak mempengaruhi chairman synthesis (chairman tetap baca full text)

## 💰 Biaya (Gratis!)

Semua model yang digunakan adalah **FREE TIER**:

| Provider | Model | Cost | Free Tier |
|----------|-------|------|-----------|
| Groq | llama-3.1-8b-instant | $0 | ✅ Unlimited* |
| Groq | mixtral-8x7b-32768 | $0 | ✅ Unlimited* |
| Groq | gemma2-9b-it | $0 | ✅ Unlimited* |
| Together | Qwen3-Next-80B | Free credits | ✅ $25 signup bonus |
| OpenRouter | nvidia/nemotron-nano:free | $0 | ✅ Free forever |

*Groq: Rate limit 30 requests/minute per API key (lebih dari cukup untuk personal use)

## 🎓 Advanced Tips

### 1. Selective Stage Review
Jika ingin cepat, baca langsung Final Answer. Jika ingin deep dive, explore semua stages.

### 2. Pattern Recognition
Perhatikan pola di Stage 2:
- Jika semua model agree = high confidence answer
- Jika divided = complex topic yang butuh nuance

### 3. Model Personality
Setiap model punya "kepribadian":
- Llama = Balanced, well-reasoned
- Mixtral = Detailed, analytical
- Gemma = Concise, practical
- Qwen = Comprehensive, academic
- Nemotron = Visual-aware (if image input)

### 4. Export Results
Coming soon: Export full council deliberation as Markdown untuk dokumentasi.

## 🔮 Future Roadmap

- [ ] Streaming responses (real-time updates per stage)
- [ ] Custom council configurations (save your favorite setups)
- [ ] Council history & replay
- [ ] Voting visualization (network graph)
- [ ] Image input support (multi-modal council)
- [ ] Export deliberation to PDF/Markdown
- [ ] Council vs Council (meta-council! 🤯)

## 🤝 Contributing

Ingin menambah fitur atau improve Agent Council? 

1. Fork repo
2. Create feature branch
3. Test thoroughly
4. Submit PR dengan deskripsi lengkap

## 📝 Credits

Dibuat dengan ❤️ menggunakan:
- React + TypeScript
- Shadcn UI components
- Groq API (fastest inference!)
- Together AI (best quality!)
- OpenRouter (most diverse!)

---

**Enjoy deliberating with your AI Council! 🏛️✨**

