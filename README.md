# ChatBotX - Multi-Provider AI Chat with RAG Document Analysis

A modern AI chat application with powerful RAG (Retrieval-Augmented Generation) capabilities. Upload your documents and get accurate, context-aware answers from multiple AI providers.

## 🌟 Key Features

- 🤖 **Multiple AI Providers**: Support for Groq, OpenRouter, Together AI, and Poe
- 📄 **RAG Document Upload**: Upload PDF, Word, TXT, Markdown, and more
- 🎯 **Context-Aware Responses**: AI uses your documents as primary source
- 💾 **Session Management**: Create, switch, and manage chat sessions
- 🗄️ **Local Storage**: All data stored securely in IndexedDB (browser-side)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- ⚡ **Real-time Streaming**: Get AI responses in real-time
- 🔒 **Enterprise-Grade Security**: SHA-256 hashing, rate limiting, session timeout, anti-bypass protection
- 🛡️ **Brute Force Protection**: Max 5 login attempts, 15-minute lockout with countdown timer
- 🔐 **Privacy First**: Document processing happens locally in your browser
- 📊 **Smart Citations**: AI references specific documents in responses
- 🆓 **Free Models Available**: Access free AI models via OpenRouter

## 🚀 What is RAG?

**RAG (Retrieval-Augmented Generation)** enhances AI responses by allowing you to upload your own documents. Instead of relying only on training data, the AI references your specific documents to provide accurate, context-aware answers.

**Perfect for:**
- 📊 Analyzing reports and data
- 📚 Research and study assistance
- 💼 Business document analysis
- 📝 Content synthesis and summarization
- 🔍 Information retrieval and fact-checking

## 📋 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file in the root directory:

```env
# Password Protection (Required - Use strong password in production!)
VITE_APP_PASSWORD=YourSecurePassword123!

# At least one API key is required

# Groq API (Recommended - Fast and Free tier available)
VITE_GROQ_API_KEY=your_groq_api_key_here

# OpenRouter API (Many free models available)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Together AI API (Optional)
VITE_TOGETHER_API_KEY=your_together_api_key_here

# Poe API (Optional)
VITE_POE_API_KEY=your_poe_api_key_here

# Optional: Site info for OpenRouter
VITE_SITE_URL=http://localhost:5173
VITE_SITE_NAME=ChatBotX
```

**Important Notes:**
- **VITE_APP_PASSWORD**: Set this to protect your application with a password. Users must enter this password before accessing the website. Default is `test123` if not set.

**Get your API keys:**
- **Groq**: https://console.groq.com/ (Free tier available!)
- **OpenRouter**: https://openrouter.ai/keys (Many free models!)
- **Together AI**: https://api.together.xyz/
- **Poe**: https://poe.com/api_key

### 3. Start Development Server

```bash
npm run dev
```

### 4. Login with Password

When you first access the application, you'll be prompted to enter a password:
- Enter the password you set in `VITE_APP_PASSWORD` (default: `test123`)
- The session will remain authenticated until you close the browser tab
- Password is required on every new browser session for security

### 5. Start Chatting!

1. Create a new chat session
2. Select your preferred AI model
3. Upload documents (optional but recommended for RAG)
4. Ask questions and get AI-powered answers!

## 📚 Using RAG (Document Upload)

### Step 1: Upload Documents

1. Click the **📎 Upload** button in the chat input area
2. **Drag & drop** files or click to browse
3. Supported formats: PDF, DOC, DOCX, TXT, MD, CSV, JSON, HTML, RTF
4. Max file size: 10 MB per file
5. Documents are processed automatically

### Step 2: Ask Questions

Once documents are uploaded:
- Type your question naturally
- AI automatically uses documents as context
- Responses include citations (e.g., "According to Document 1...")
- Documents remain active throughout the session

### Step 3: Manage Documents

- View all uploaded documents in the management panel
- Remove documents you no longer need
- Upload additional documents at any time
- Toggle RAG on/off in the header if needed

### Example Usage

```
📄 Upload: quarterly_report_q4.pdf

💬 You: What was our revenue growth in Q4?

🤖 AI: According to Document 1 (quarterly_report_q4.pdf), 
the revenue growth in Q4 was 32% year-over-year, 
increasing from $12.5M to $16.5M. The document attributes 
this growth primarily to the launch of the new product line 
and expansion into the European market.
```

## 🎨 Available AI Models

### Groq (Lightning Fast ⚡)
- **Llama 3.1 8B Instant**: Ultra-fast responses
- **Llama 3.1 70B Versatile**: Powerful and versatile
- **Mixtral 8x7B**: Excellent reasoning
- **Gemma 2 9B**: Google's efficient model

### OpenRouter (Many Free! 🆓)
- **Llama 3.2 3B Free**: Fast and free
- **Llama 3.1 8B Free**: Solid performance
- **Mistral 7B Free**: Great quality
- **MiniMax M2 Free**: Excellent free model
- **Nvidia Nemotron Nano 12B**: Free with vision
- And many more!

### Together AI
- **Llama 3.1 8B Turbo**: Fast inference
- **Qwen 2.5 7B**: High quality
- **Mistral 7B Instruct**: Instruction-tuned

### Poe
- **GPT-5-mini**: Balanced performance
- **Gemini 2.5 Flash**: Google's fast model
- **Claude Sonnet**: Advanced reasoning

## 🔧 Advanced Features

### Multi-Document Analysis
Upload multiple related documents:
- AI synthesizes information across documents
- Compares and contrasts content
- Identifies patterns and relationships
- Provides comprehensive answers

### Document Citations
AI always cites sources:
```
"According to Document 1 (report.pdf), revenue was $16.5M..."
"Document 2 (notes.txt) mentions that the project timeline is 6 months..."
```

### Privacy & Security
- ✅ All document processing happens **locally in your browser**
- ✅ No server uploads (documents never leave your device)
- ✅ Documents stored in browser IndexedDB
- ✅ Cleared when you clear browser data
- ⚠️ Document content IS sent to AI providers when generating responses

### Agent Mode
Run multiple AI models simultaneously on the same prompt - perfect for comparing responses!

### Debate Mode
Create AI debates with different personality types or teams for diverse perspectives.

## 📄 Supported File Formats

| Format | Extension | Max Size | Notes |
|--------|-----------|----------|-------|
| PDF | `.pdf` | 10 MB | Full text extraction |
| Word | `.doc`, `.docx` | 10 MB | Microsoft Word |
| Text | `.txt` | 5 MB | Plain text |
| Markdown | `.md` | 5 MB | Preserves formatting |
| CSV | `.csv` | 5 MB | Comma-separated |
| JSON | `.json` | 5 MB | JSON data |
| HTML | `.html` | 5 MB | Web pages |
| RTF | `.rtf` | 5 MB | Rich Text Format |

## 💡 Best Practices

### ✅ Do's
- Upload relevant documents for your questions
- Use clear, well-structured documents
- Keep files under recommended size limits
- Remove documents when no longer needed
- Ask specific questions for better answers

### ❌ Don'ts
- Avoid uploading huge files (>10 MB)
- Don't mix unrelated topics in one session
- Avoid scanned PDFs without text (OCR not supported yet)
- Don't overload with too many large documents
- Skip uploading empty or corrupted files

## 🛠️ Project Structure

```
src/
├── components/
│   ├── ChatArea.tsx           # Main chat interface with RAG
│   ├── ChatSidebar.tsx        # Sessions and model selector
│   ├── ChatMessage.tsx        # Message display component
│   ├── DocumentUpload.tsx     # Document upload interface
│   ├── RAGIndicator.tsx       # RAG status indicator
│   ├── SettingsSidebar.tsx    # Configuration panel
│   ├── DesktopHeader.tsx      # Desktop header
│   └── MobileHeader.tsx       # Mobile header
├── lib/
│   ├── db.ts                  # IndexedDB storage service
│   ├── documentProcessor.ts   # Document text extraction
│   ├── aiApi.ts               # Unified AI API interface
│   ├── groqApi.ts             # Groq integration
│   ├── openrouterApi.ts       # OpenRouter integration
│   ├── togetherApi.ts         # Together AI integration
│   └── poeApi.ts              # Poe integration
├── hooks/
│   └── useRAG.ts              # RAG functionality hook
└── pages/
    └── Index.tsx              # Main application page
```

## 🔍 Troubleshooting

### Document Won't Upload
**Problem**: File not uploading or processing fails

**Solutions**:
- Check file size (should be under 10 MB)
- Verify file format is supported
- Ensure file isn't corrupted or empty
- Try a different browser if issues persist
- Check browser console for error messages

### AI Not Using Document Context
**Problem**: AI responses don't reference uploaded documents

**Solutions**:
- Verify RAG is enabled (toggle in header)
- Confirm documents uploaded successfully (green checkmark)
- Ask questions directly related to document content
- Rephrase your question to be more specific
- Ensure documents contain relevant information

### Slow Performance
**Problem**: Document processing or responses are slow

**Solutions**:
- Reduce document file sizes
- Remove unnecessary documents from session
- Use text formats instead of PDFs when possible
- Close other browser tabs to free memory
- Try a faster AI provider (e.g., Groq)

### No Providers Available
**Problem**: No AI models showing in sidebar

**Solutions**:
- Ensure at least one API key is set in `.env`
- Restart the development server after adding keys
- Check browser console for error messages
- Verify API key validity at provider's website

## 📖 Documentation

- **[RAG Documentation](./RAG_DOCUMENTATION.md)** - Complete RAG guide with technical details
- **[RAG Summary](./RAG_SUMMARY.md)** - Quick reference for RAG features
- **[Quick Start Guide](./QUICK_START.md)** - Getting started guide
- **[Feature Summary](./FEATURE_SUMMARY.md)** - All features overview
- **[Changelog](./CHANGELOG.md)** - Version history and updates

## ⌨️ Keyboard Shortcuts

- **Ctrl/Cmd + K**: Open settings sidebar
- **Enter**: Send message
- **Shift + Enter**: New line in message input

## 🔗 Project Links

- **Lovable Project**: https://lovable.dev/projects/580a49b9-1db2-444a-919e-e0ef52b117b2
- **Documentation**: See files in project root

## 🛠️ Technologies Used

- **Vite** - Fast build tool
- **React** - UI framework
- **TypeScript** - Type safety
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first styling
- **IndexedDB** - Browser-based database
- **Multiple AI APIs** - Groq, OpenRouter, Together AI, Poe
- **PDF.js** - PDF text extraction
- **Mammoth.js** - Word document processing

## 🚀 Deployment

### Using Lovable
Simply open [Lovable](https://lovable.dev/projects/580a49b9-1db2-444a-919e-e0ef52b117b2) and click on **Share → Publish**.

### Custom Domain
Navigate to **Project > Settings > Domains** and click **Connect Domain**.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 💻 Development

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Code Style

```bash
# Run linter
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please follow the guidelines in [AGENTS.md](./AGENTS.md) for:
- Code style and conventions
- Commit message format
- Pull request guidelines
- Testing requirements

## 📊 Database Schema

### Sessions Table
- `id`: Unique session identifier
- `title`: Session display name
- `timestamp`: Creation timestamp
- `modelName`: Associated AI model (format: "provider:modelId")
- `provider`: AI provider name
- `modelId`: Model identifier
- `lastMessage`: Preview of last message

### Messages Table
- `id`: Unique message identifier
- `sessionId`: Reference to parent session
- `role`: "user" or "ai"
- `content`: Message text content
- `timestamp`: Message timestamp
- `modelName`: Model used (for AI messages)
- `metadata`: Performance metrics (duration, tokens, speed)

## 🔐 Security & Privacy

### Password Protection (Enterprise-Grade 🔒)

**Multi-Layer Security Features:**
- ✅ **SHA-256 Password Hashing** - Passwords never stored in plain text
- ✅ **Rate Limiting** - Max 5 login attempts with 15-minute lockout
- ✅ **Session Timeout** - Auto-logout after 60 minutes of inactivity
- ✅ **Encrypted Session Storage** - Session data encrypted with random tokens
- ✅ **Anti-Bypass Protection** - Detects and prevents console manipulation
- ✅ **Timing Attack Prevention** - Consistent response times prevent password guessing
- ✅ **Storage Manipulation Detection** - Auto-reload on unauthorized changes
- ✅ **DevTools Detection** - Warns when developer tools are opened

**How It Works:**
1. Password set in `.env` file (never committed to Git)
2. Password hashed with SHA-256 before comparison
3. Failed attempts tracked - account locks after 5 failures
4. Session expires automatically after 60 minutes
5. All session data encrypted with unique random tokens

**For More Details:**
- See `PASSWORD_SETUP.md` for setup guide
- See `SECURITY_FEATURES.md` for technical details
- See `PANDUAN_KEAMANAN.md` for Indonesian guide

**⚠️ IMPORTANT:** Always use a strong password in production! (12+ characters, mixed case, numbers, symbols)

### Data Storage
- All data stored locally in browser IndexedDB
- No server-side storage or database
- Documents processed client-side
- Session data persists until manually deleted or browser data cleared

### API Communication
- API keys stored in environment variables
- Never committed to version control
- HTTPS encryption for all API calls
- Document content sent to AI providers only during generation

### Security Best Practices
- ✅ **Use strong passwords** - Minimum 12 characters with mixed case, numbers, and symbols
- ✅ **Never commit `.env`** - Already in `.gitignore`, keep it that way
- ✅ **Enable HTTPS** - Always use HTTPS in production environments
- ✅ **Regular password rotation** - Change passwords every 3-6 months
- ✅ **Use password managers** - Store passwords securely (1Password, LastPass, etc.)
- ✅ **Monitor failed logins** - Check for unusual login attempt patterns
- ✅ **Clear browser data** - When using shared/public computers
- ✅ **Review AI provider policies** - Understand how your data is handled
- ✅ **Use incognito mode** - For sensitive documents on shared devices

### Example Strong Passwords
```
❌ WEAK: test123, password, admin, 123456
✅ STRONG: H@d3sCh@t!2024$Secure, mK9#pL2$vN8@xQ5&zR7^
```

## ❓ FAQ

**Q: Are my documents saved on a server?**  
A: No. All documents are processed and stored locally in your browser.

**Q: Can I use RAG with any AI model?**  
A: Yes. RAG works with all supported providers.

**Q: How many documents can I upload?**  
A: Limited by browser storage (typically 50 MB - 1 GB). Recommended: 5-10 documents per session.

**Q: Do documents persist across sessions?**  
A: Documents are session-specific. Each chat has its own document set.

**Q: Does RAG work offline?**  
A: Document processing works offline, but AI responses require internet.

**Q: Which file formats are best?**  
A: Text-based formats (TXT, MD) are fastest. PDFs work well but are slower to process.

## 🗺️ Roadmap

### Coming Soon
- [ ] Image OCR support (extract text from scanned PDFs)
- [ ] Document summarization
- [ ] Advanced semantic search within documents
- [ ] Document versioning
- [ ] Export/import document sets
- [ ] Citation highlighting in responses

### Under Consideration
- [ ] Multi-modal RAG (images, audio, video)
- [ ] Cloud storage integration
- [ ] Real-time collaboration
- [ ] Custom chunking strategies
- [ ] Vector embeddings for better retrieval

## 📝 License

MIT License - See LICENSE file for details

---

**Built with ❤️ using React, TypeScript, and modern web technologies**

For detailed RAG documentation, see [RAG_DOCUMENTATION.md](./RAG_DOCUMENTATION.md)