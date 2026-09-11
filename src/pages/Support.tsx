import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { GoogleGenAI } from "@google/genai";
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronDown, 
  Search,
  ExternalLink,
  Send,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FAQItem = ({ question, answer }: { question: string; answer: string; key?: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="font-bold text-lg">{question}</span>
        <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 text-slate-500 dark:text-slate-400 leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Support() {
  const { user } = useUser();
  const [complaint, setComplaint] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: 'bot', text: 'Hello! I am your SmartBill AI assistant. How can I help you today?' }
  ]);

  const faqs = [
    {
      question: "How do I add family members?",
      answer: "Go to the Profile page, and if you are the primary account holder, you will see a 'Family Group' section. You can add members by entering their email address. They will then be able to access the shared family bills."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, SmartBill uses industry-standard encryption and secure payment gateways. We do not store your full card details on our servers. All transactions are processed through verified payment providers."
    },
    {
      question: "Can I download receipts for past payments?",
      answer: "Absolutely! Navigate to the 'History' page where you can see all your past transactions. Each entry has a 'Download Receipt' button that generates a PDF for your records."
    },
    {
      question: "What happens if I miss a due date?",
      answer: "Bills that are past their due date will be marked as 'Overdue' in the Pay Bill section. We recommend paying them as soon as possible to avoid any service interruptions or late fees from the provider."
    },
    {
      question: "How do I change my account password?",
      answer: "Currently, password changes can be requested through our support team or by using the 'Forgot Password' link on the login page. We are working on adding a direct password management feature in the Settings page soon."
    }
  ];

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setIsSubmitting(true);
    
    try {
      const ticketData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        subject: complaint.subject,
        message: complaint.message,
        status: 'open',
        timestamp: new Date().toISOString(),
        adminEmail: 'yaksinik@gmail.com'
      };

      await addDoc(collection(db, 'support_tickets'), ticketData);
      
      console.log(`Complaint saved and notification simulated to yaksinik@gmail.com and ${user.email}`);
      
      setSubmitted(true);
      setComplaint({ subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Failed to send complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { role: 'user', text: chatMessage };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatMessage('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a helpful customer support assistant for "SmartBill", a family bill management app. 
                The user's name is ${user?.displayName || 'User'}. 
                SmartBill features: shared family accounts, bill history, PDF receipts, and online payments for Mobile, Electricity, Water, Gas, Internet, DTH, and Maintenance.
                
                Previous conversation:
                ${chatHistory.map(m => `${m.role}: ${m.text}`).join('\n')}
                
                User says: ${chatMessage}`
              }
            ]
          }
        ],
        config: {
          systemInstruction: "Be professional, concise, and helpful. If you can't solve a problem, suggest they use the 'Contact Support' form or call +91 1800-SMART-BILL."
        }
      });

      const botText = response.text || "I'm sorry, I'm having trouble connecting to my brain right now. Please try again or contact our support team.";
      setChatHistory([...newHistory, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setChatHistory([...newHistory, { role: 'bot', text: "I'm sorry, I encountered an error. Please contact our support team directly." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">How can we help?</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Search our knowledge base or contact our support team.</p>
        
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input 
            type="text" 
            placeholder="Search for questions, topics, or keywords..." 
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-lg text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500 p-8 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
          <MessageCircle size={32} className="mb-4" />
          <h3 className="text-xl font-bold mb-2">Live Chat</h3>
          <p className="text-emerald-50 text-sm mb-6">Chat with our support team in real-time.</p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-full py-3 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-colors"
          >
            Start Chat
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Phone size={32} className="mb-4 text-blue-500" />
          <h3 className="text-xl font-bold mb-2">Call Us</h3>
          <p className="text-slate-500 text-sm mb-6">Available Mon-Fri, 9am - 6pm IST.</p>
          <p className="font-bold text-lg">+91 1800-SMART-BILL</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Mail size={32} className="mb-4 text-purple-500" />
          <h3 className="text-xl font-bold mb-2">Email Support</h3>
          <p className="text-slate-500 text-sm mb-6">We usually respond within 24 hours.</p>
          <p className="font-bold text-lg">support@smartbill.com</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold px-2">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold px-2">Contact Support</h2>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 px-1">Subject</label>
                <input 
                  type="text" 
                  required
                  value={complaint.subject}
                  onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })}
                  placeholder="What is this regarding?"
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 px-1">Message</label>
                <textarea 
                  required
                  rows={4}
                  value={complaint.message}
                  onChange={(e) => setComplaint({ ...complaint, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={20} />
                    Send Complaint
                  </>
                )}
              </button>
              {submitted && (
                <p className="text-emerald-500 text-sm font-bold text-center animate-bounce">
                  Complaint sent to yaksinik@gmail.com! We'll get back to you soon.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-10 text-center text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">Our specialized support team is ready to assist you with any technical or billing issues you might encounter.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm">
              <Mail size={16} className="text-emerald-400" />
              yaksinik@gmail.com
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm">
              <MapPin size={16} className="text-blue-400" />
              Bangalore, India
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
            >
              {/* Chat Header */}
              <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">SmartBill Support</h3>
                    <p className="text-xs text-emerald-100">Online | Typical reply in 1m</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                />
                <button 
                  type="submit"
                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
