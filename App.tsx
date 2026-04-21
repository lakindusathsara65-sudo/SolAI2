import React, { useState, useRef, useEffect } from 'react';
import { 
  Leaf, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Send, 
  CloudSun, 
  MapPin, 
  Info,
  ChevronRight,
  Loader2,
  Trash2,
  Camera,
  Layers,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzeGardenImage, generateGardenVisualization, chatAboutGarden, analyzeFacebookInfo } from './lib/ai';

type Message = {
  role: 'user' | 'model';
  content: string;
};

type DesignResult = {
  id: string;
  type: 'analysis' | 'visualization';
  content: string;
  imageUrl?: string;
  timestamp: number;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'analyze' | 'chat'>('create');
  const [preferences, setPreferences] = useState({
    style: 'Modern Zen',
    climate: 'Temperate',
    sunlight: 'Full Sun',
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<DesignResult[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      setIsGenerating(true);
      try {
        const analysis = await analyzeGardenImage(base64, file.type, "Analyze this garden design or Facebook page screenshot for plant inspiration and layout ideas.");
        if (analysis) {
          const newResult: DesignResult = {
            id: Date.now().toString(),
            type: 'analysis',
            content: analysis,
            imageUrl: reader.result as string,
            timestamp: Date.now(),
          };
          setResults(prev => [newResult, ...prev]);
        }
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!customPrompt && !preferences.style) return;
    setIsGenerating(true);
    try {
      const imageUrl = await generateGardenVisualization(customPrompt, preferences);
      if (imageUrl) {
        const newResult: DesignResult = {
          id: Date.now().toString(),
          type: 'visualization',
          content: `### Visualization\n\nDream garden visualization based on: ${customPrompt || preferences.style}`,
          imageUrl: imageUrl,
          timestamp: Date.now(),
        };
        setResults(prev => [newResult, ...prev]);
        setActiveTab('create');
      }
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const historyForAi = chatHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      const responseText = await chatAboutGarden(userMsg, historyForAi);
      if (responseText) {
        setChatHistory(prev => [...prev, { role: 'model', content: responseText }]);
      }
    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="border-b border-line px-8 py-6 flex justify-between items-baseline bg-surface z-10">
        <div>
          <h1 className="text-[48px] font-light leading-[0.9] tracking-[-2px] mb-1">SolAI.</h1>
          <span className="text-[11px] uppercase tracking-[2px]">Intelligent Garden Architect</span>
        </div>
        <nav className="flex gap-8 text-[13px] uppercase tracking-wider font-medium text-ink/70">
          <button onClick={() => setActiveTab('create')} className={`hover:text-ink transition-colors ${activeTab === 'create' ? 'text-ink border-b border-ink' : ''}`}>Design</button>
          <button onClick={() => setActiveTab('analyze')} className={`hover:text-ink transition-colors ${activeTab === 'analyze' ? 'text-ink border-b border-ink' : ''}`}>Analyze</button>
          <button onClick={() => setActiveTab('chat')} className={`hover:text-ink transition-colors ${activeTab === 'chat' ? 'text-ink border-b border-ink' : ''}`}>Expert</button>
        </nav>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-px bg-line">
        
        {/* Left Panel: Inputs */}
        <aside className="bg-surface p-6 flex flex-col gap-8">
          <section>
            <div className="tag">Configuration</div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted block mb-1">Style</label>
                <select 
                  value={preferences.style}
                  onChange={(e) => setPreferences({...preferences, style: e.target.value})}
                  className="w-full bg-highlight border border-line px-3 py-2 text-sm appearance-none outline-none focus:border-accent"
                >
                  <option>Modern Zen</option>
                  <option>English Cottage</option>
                  <option>Mediterranean</option>
                  <option>Tropical Oasis</option>
                  <option>Desert Xeriscape</option>
                </select>
              </div>
              <textarea 
                placeholder="Specific botanical requests..."
                className="w-full bg-highlight border border-line p-3 text-sm min-h-[100px] outline-none focus:border-accent resize-none"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-ink text-white py-3 text-[11px] uppercase tracking-[1px] hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isGenerating ? 'Generating...' : 'Visualize Blueprint'}
              </button>
            </div>
          </section>

          <section>
            <div className="tag">Inspiration Node</div>
            <div className="analysis-box">
              <div className="text-[24px] mb-2 text-accent">+</div>
              <div className="text-[12px] leading-relaxed text-muted">
                Analyze FB Page or Layout
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Paste Page Link..."
                  className="w-full bg-white border border-line px-3 py-2 text-[11px] outline-none"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const input = (e.target as HTMLInputElement).value;
                      if (!input) return;
                      setIsGenerating(true);
                      try {
                        let pageId = input.split('/').filter(Boolean).pop();
                        if (pageId?.includes('?')) pageId = pageId.split('?')[0];
                        const fbResponse = await fetch(`/api/fb-page-info?pageId=${pageId}`);
                        if (fbResponse.ok) {
                          const fbData = await fbResponse.json();
                          const analysis = await analyzeFacebookInfo(fbData);
                          setResults(prev => [{
                            id: Date.now().toString(),
                            type: 'analysis',
                            content: `### Inspiration Source: ${fbData.name}\n\n${analysis}`,
                            imageUrl: fbData.picture?.data?.url,
                            timestamp: Date.now()
                          }, ...prev]);
                        }
                      } finally {
                        setIsGenerating(false);
                      }
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-line py-2 text-[10px] uppercase tracking-wider hover:bg-highlight transition-all"
                >
                  Upload Screenshot
                </button>
              </div>
            </div>
          </section>
        </aside>

        {/* Center: Canvas */}
        <main className="bg-[#E9E6DC] relative overflow-hidden flex flex-col items-center justify-center rounded-tl-[120px]">
          <div className="absolute top-8 right-8 text-[64px] font-serif opacity-5 select-none pointer-events-none">01</div>
          
          <div className="w-full h-full p-12 overflow-y-auto">
            <AnimatePresence mode="wait">
              {results.length === 0 && !isGenerating ? (
                <div className="h-full flex items-center justify-center opacity-20 transform -rotate-2">
                  <div className="text-center">
                    <ImageIcon size={64} className="mx-auto mb-4" />
                    <p className="font-serif text-2xl italic">Waiting for an idea to bloom...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {isGenerating && (
                    <div className="flex flex-col items-center gap-4 py-20">
                      <Loader2 className="animate-spin text-accent w-10 h-10" />
                      <p className="text-muted text-sm font-serif italic">Synthesizing landscape nodes...</p>
                    </div>
                  )}
                  {results.map((result) => (
                    <motion.div 
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="max-w-3xl mx-auto"
                    >
                      <div className="bg-white p-2 border border-line shadow-sm mb-6 inline-block">
                        {result.imageUrl && (
                          <img src={result.imageUrl} alt="Landscape" className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="prose prose-stone max-w-none prose-sm lg:prose-base font-sans leading-relaxed">
                        <ReactMarkdown>{result.content}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Panel: Data/Expert */}
        <aside className="bg-surface p-6 flex flex-col">
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chat' ? (
              <div className="h-full flex flex-col">
                <div className="tag">Expert Consultation</div>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <p className="text-[11px] text-muted leading-relaxed italic border-l-2 border-accent pl-3">
                      SolAI Expert is online. Ask about hardiness zones, perennial pairings, or soil pH.
                    </p>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`text-[12px] leading-relaxed ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-block px-3 py-2 max-w-[90%] ${msg.role === 'user' ? 'bg-highlight border border-line text-ink' : 'border-l border-accent mb-2 pl-3'}`}>
                        {msg.content}
                      </span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleChat} className="mt-auto pt-4 border-t border-line">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Consult with architect..."
                    className="w-full bg-highlight border border-line px-3 py-3 text-[11px] outline-none"
                  />
                </form>
              </div>
            ) : (
              <div>
                <div className="tag">Botanical Components</div>
                <div className="space-y-4">
                  <div className="plant-card">
                    <div className="serif text-[14px]">Botanical Nodes</div>
                    <div className="text-[11px] opacity-60 italic mb-2">Identified in recent analysis</div>
                    <div className="flex flex-wrap gap-1">
                      {['Cedar', 'Fern', 'Maple', 'Moss'].map(p => (
                        <span key={p} className="text-[9px] bg-highlight border border-line px-2 py-0.5 rounded-full">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="sidebar-num serif opacity-5 transform rotate-12 -right-4 top-0 group-hover:opacity-10 transition-opacity">02</div>
                    <p className="text-[11px] text-muted italic">
                      "A garden should feel like a painting that never finishes."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button className="mt-8 bg-ink text-white w-full py-4 text-[11px] uppercase tracking-[1px] hover:bg-[#333] transition-colors">
            Export Blueprint
          </button>
        </aside>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2DFD6; }
        
        /* Italic serif highlight for markdowns */
        .prose em { font-family: 'Georgia', serif; }
        .prose h1, .prose h2, .prose h3 { font-weight: 300; letter-spacing: -1px; }
      `}</style>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative group flex flex-col items-center gap-1 transition-all ${active ? 'text-[#5A6D51]' : 'text-[#9A9A9A] hover:text-[#5A6D51]'}`}
    >
      <div className={`p-3 rounded-2xl transition-all ${active ? 'bg-[#E2F0D9]' : 'bg-transparent group-hover:bg-[#F9FBF8]'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">
        {label}
      </span>
    </button>
  );
}
