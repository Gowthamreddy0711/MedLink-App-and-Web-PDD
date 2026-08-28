import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, Bot, User, Sparkles, AlertTriangle, ShieldCheck, Trash2, Calendar, Users, Megaphone, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { querySmartAssistant, AssistantContext } from '../../services/smartAssistantEngine';
import { cn } from '../../lib/utils';
import { db } from '../../services/db';

export default function AIChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([
    { 
      id: '1', 
      role: 'assistant',
      text: 'Hello! I am your MedLink Smart Assistant. I provide instant operational insights from your clinic data. How can I help you today?',
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadData = async () => {
      const userStr = localStorage.getItem('medlink_user');
      if (userStr) setCurrentUser(JSON.parse(userStr));

      const allDocs = await db.getDoctors();
      setDoctors(allDocs);

      const allReqs = await db.getLeaveRequests();
      setRequests(allReqs);

      const allNotices = await db.getNotifications('SYSTEM'); // Assuming notices are here or use another service
      setNotices(allNotices);
    };
    loadData();
  }, []);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isTyping) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
        const context: AssistantContext = {
            currentUser,
            doctors,
            leaveRequests: requests,
            volunteers: [],
            notices
        };
        const result = querySmartAssistant(textToSend, context);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', text: result.answer, timestamp: new Date() }]);
        setIsTyping(false);
    }, 400);
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-50">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 bg-slate-50 rounded-xl">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black text-blue-900 tracking-tight flex items-center gap-2 leading-none">
              Smart Assistant <ShieldCheck className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Co-pilot v2.0</p>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex items-center justify-between bg-blue-600 px-4 py-3 text-white sm:px-6">
         <div className="flex items-center gap-2 relative z-10">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Direct Data Access • Instant Response</span>
         </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6 pb-32">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "max-w-[85%] p-5 rounded-[2rem]",
                m.role === 'user' ? "bg-blue-600 text-white self-end rounded-tr-none shadow-lg" : "bg-white border border-slate-100 text-blue-950 self-start rounded-tl-none shadow-sm"
              )}
            >
              <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 z-20 border-t border-slate-100 bg-white p-4 pb-20 lg:pb-6 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto flex-1 no-scrollbar">
             {[
               { label: '📋 Duties', text: 'Summarize my duties' },
               { label: '🔍 Coverage', text: 'Find coverage' },
               { label: '🏥 Notices', text: 'Show hospital notices' }
             ].map((chip) => (
               <button
                 key={chip.label}
                 onClick={() => handleSend(chip.text)}
                 className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
               >
                  {chip.label}
               </button>
             ))}
          </div>
          <button onClick={() => setMessages([])} className="p-2 ml-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-5 h-5" /></button>
        </div>

        <div className="bg-slate-50 rounded-[2rem] p-2 flex items-center border border-slate-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your clinical question..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 font-medium text-sm text-blue-950"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg disabled:bg-slate-300"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
