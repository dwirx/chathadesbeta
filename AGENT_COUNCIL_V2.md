# Agent Council Mode V2 - Enhanced Features 🚀

## What's New

### ✅ Model Selection & Customization
- **Choose Your Own Models**: Pick any model from Groq, Together AI, or OpenRouter
- **Add/Remove Members**: Customize council size (2-10 members)
- **Change Chairman**: Select best model for final synthesis
- **Save Configurations**: Your settings persist across sessions
- **Reset to Default**: One-click restore to default config

### ✅ Dynamic Model Loading
- **Auto-Load Models**: Hooks fetch available models from each provider
- **Real-Time Selection**: Choose from all available models
- **Provider Detection**: Auto-detect configured API keys
- **Free Models Filtering**: OpenRouter shows only free models

### ✅ Mobile-First Responsive Design
- **Fully Responsive**: Works perfectly on mobile, tablet, and desktop
- **Touch Optimized**: All interactions work with touch
- **Compact Mobile UI**: Optimized layout for small screens
- **Collapsible Config**: Hide/show configuration panel
- **Adaptive Text Sizes**: Readable on all screen sizes

### ✅ Improved UX
- **Visual Feedback**: Save/Reset buttons with toast notifications
- **Real-Time Config**: Changes apply immediately
- **Smart Validation**: Minimum 2 members, maximum 10
- **Provider-Specific Models**: Only show models for selected provider
- **Persistent Storage**: Config saved to localStorage

## Setup & Usage

### 1. Configure API Keys (Same as before)

```env
VITE_GROQ_API_KEY=gsk_xxxxx
VITE_TOGETHER_API_KEY=xxxxx
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### 2. Open Agent Council

From ChatSidebar or SettingsSidebar, click "Council" button.

### 3. Customize Your Council (NEW!)

Click **Config** button in header to show configuration panel:

#### Add Council Member:
1. Click **+ (Plus)** button
2. Enter member name
3. Select provider (Groq/Together/OpenRouter)
4. Choose model from dropdown
5. Click **Save** to persist

#### Remove Council Member:
1. Click **Trash** icon on member card
2. Minimum 2 members required

#### Change Chairman:
1. In "Chairman" section
2. Update name, provider, or model
3. Click **Save**

#### Reset to Default:
1. Click **Reset (RotateCcw)** button
2. Confirms reset with toast notification

### 4. Ask Your Question

Type question and press Enter. Council will:
- Stage 1: All members respond (~10s)
- Stage 2: Peer ranking (~15s)
- Stage 3: Chairman synthesis (~10s)

## Mobile Usage

### Optimizations:
- **Responsive Dialog**: Auto-sizes to screen
- **Touch Buttons**: Larger touch targets on mobile
- **Scrollable Config**: Config panel scrolls if needed
- **Compact Layout**: Space-efficient on small screens
- **Hidden Labels**: Text shortened on mobile

### Mobile Tips:
- Swipe to scroll tabs
- Long-press for select
- Tap Config to show/hide settings
- Landscape for better config experience

## Configuration Options

### Council Members (2-10)

Each member has:
- **Name**: Display name (e.g., "Llama Scholar")
- **Provider**: groq | together | openrouter
- **Model**: Any available model from that provider

**Examples**:
```typescript
// Fast & Free (Groq)
{
  name: "Speed Demon",
  provider: "groq",
  modelId: "llama-3.1-8b-instant"
}

// Quality (Together AI)
{
  name: "Quality Expert",
  provider: "together",
  modelId: "Qwen/Qwen3-Next-80B-A3B-Instruct"
}

// Vision Capable (OpenRouter)
{
  name: "Vision Oracle",
  provider: "openrouter",
  modelId: "nvidia/nemotron-nano-12b-v2-vl:free"
}
```

### Chairman

The chairman synthesizes final answer. Choose:
- **Largest Model**: Best quality (e.g., Qwen 80B)
- **Fastest Model**: Quick results (e.g., Llama 8B)
- **Balanced**: Medium size (e.g., Mixtral 8x7B)

## Use Cases

### Small Council (2-3 members) - Fast Results
Perfect for:
- Quick questions
- Time-sensitive queries
- When API rate limits apply
- Personal use

**Example Config**:
- Llama 8B (Groq)
- Mixtral 8x7B (Groq)
- Chairman: Qwen 80B (Together)

### Medium Council (4-6 members) - Balanced
Perfect for:
- Standard questions
- General use
- Good diversity
- Reasonable speed (~30s)

**Example Config** (default):
- Llama 8B (Groq)
- Mixtral 8x7B (Groq)
- Gemma 9B (Groq)
- Qwen 80B (Together)
- Nemotron 12B (OpenRouter)
- Chairman: Qwen 80B (Together)

### Large Council (7-10 members) - Maximum Diversity
Perfect for:
- Complex questions
- Research purposes
- Critical decisions
- When speed is not critical (~60s)

**Example Config**:
- All Groq models (5+)
- Multiple Together models
- OpenRouter free models
- Chairman: Best available (80B+)

## Technical Details

### Hooks Integration

```typescript
// Auto-load models from providers
const { models: groqModels } = useGroqModels();
const { models: togetherModels } = useTogetherModels();
const { freeModels: openrouterModels } = useOpenRouterModels();
```

### Persistent Configuration

```typescript
// Save config to localStorage
saveCouncilConfig({ members, chairman });

// Load on startup
const config = loadCouncilConfig();
```

### Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm-lg)
- **Desktop**: > 1024px (lg+)

## Keyboard Shortcuts

- **Enter**: Submit question
- **Shift+Enter**: New line in textarea
- **Escape**: Close dialog (built-in)

## Performance

### Loading Times:
- **Model Loading**: ~1-2s (cached 24h)
- **Config Save**: < 100ms
- **Stage 1**: ~2-5s per model (parallel)
- **Stage 2**: ~3-5s per model (parallel)
- **Stage 3**: ~5-10s (single chairman)

### Optimizations:
- **Parallel Queries**: Stage 1 & 2 run in parallel
- **Model Caching**: Models cached for 24 hours
- **Config Caching**: Settings persist across sessions
- **Lazy Loading**: Models load on-demand

## Troubleshooting

### "No models available"
- Check API key is configured
- Wait for models to load (spinner in dropdown)
- Try refresh page

### "Minimum 2 members required"
- Council must have at least 2 members
- Add members before removing

### "Maximum 10 members reached"
- Council limited to 10 members for performance
- Remove members to add new ones

### Models not showing in dropdown
- Select provider first
- Wait for loading to complete
- Check API key is valid

### Config not saving
- Check localStorage is enabled
- Check browser storage quota
- Try manual save again

## Advanced Tips

### 1. Specialized Councils

**Code Review Council**:
- All code-specialized models
- DeepSeek Coder (if available)
- Mixtral (good at code)
- Chairman: Largest coder model

**Research Council**:
- Academic/research-oriented models
- Qwen (good at facts)
- Gemma (balanced)
- Chairman: Largest model available

**Creative Council**:
- Diverse small-medium models
- Mix of providers
- Chairman: Creative-leaning model

### 2. Speed Optimization

For fastest results:
- Use only Groq models (fastest inference)
- Keep council small (2-3 members)
- Use smaller models (8B-13B)
- Chairman: Groq model

### 3. Quality Optimization

For best quality:
- Mix providers for diversity
- Use largest models available
- 5-7 members optimal
- Chairman: 70B+ model

### 4. Cost Optimization

All free! But for rate limits:
- Spread across providers
- Use free tiers wisely
- Cache responses
- Limit council size

## Browser Compatibility

### Fully Supported:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Chrome/Safari

### Features:
- ✅ LocalStorage (for config)
- ✅ Fetch API (for models)
- ✅ Async/Await (for queries)
- ✅ Dialog (for modal)
- ✅ Touch Events (for mobile)

## Future Enhancements

- [ ] Preset Configurations (Quick select)
- [ ] Import/Export Config (Share setups)
- [ ] Council Templates (Pre-made configs)
- [ ] Performance Analytics (Time per stage)
- [ ] Token Usage Tracking
- [ ] Streaming Responses (Real-time)
- [ ] Multi-Language Support
- [ ] Keyboard Navigation (Full a11y)

## Changelog

### V2.0 (Current)
- ✅ Model selection & customization
- ✅ Dynamic model loading with hooks
- ✅ Mobile-responsive design
- ✅ Persistent configuration
- ✅ Add/remove members
- ✅ Provider-specific model filtering

### V1.0 (Initial)
- ✅ 3-stage council orchestration
- ✅ Default 5 models + chairman
- ✅ Basic UI with tabs
- ✅ Markdown rendering
- ✅ Session history

---

**Enjoy your fully customizable Agent Council! 🏛️✨**

