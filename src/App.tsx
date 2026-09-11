/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  LayoutDashboard, 
  CreditCard, 
  History, 
  User, 
  HelpCircle, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun,
  ShieldCheck,
  Bell,
  ChevronDown,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PayBill from './pages/PayBill';
import PaymentHistory from './pages/PaymentHistory';
import Profile from './pages/Profile';
import Support from './pages/Support';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import LegalPage from './pages/LegalPage';

// Utils
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Contexts
const ThemeContext = createContext<{ theme: 'light' | 'dark'; toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });
const UserContext = createContext<{ user: any; loading: boolean }>({ user: null, loading: true });

export const useTheme = () => useContext(ThemeContext);
export const useUser = () => useContext(UserContext);

const SidebarItem = ({ to, icon: Icon, label, active, onClick }: { to: string; icon: any; label: string; active: boolean; onClick?: () => void; key?: any }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-white" : "text-slate-400")} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { theme } = useTheme();
  const { user } = useUser();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pay', icon: CreditCard, label: 'Pay Bill' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/support', icon: HelpCircle, label: 'Support' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', icon: ShieldCheck, label: 'Admin Panel' });
  }

  const handleLogout = () => {
    signOut(auth);
    setIsProfileOpen(false);
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-300", theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between h-20 px-8 border-b dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 ml-72">
        <h2 className="text-xl font-bold capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</h2>
        
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all relative"
            >
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>
            
            <AnimatePresence>
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold">Notifications</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">2 New</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b dark:border-slate-800 cursor-pointer">
                        <p className="text-sm font-bold mb-1">Electricity Bill Due</p>
                        <p className="text-xs text-slate-500">Your BESCOM bill of ₹1,240 is due in 2 days.</p>
                      </div>
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b dark:border-slate-800 cursor-pointer">
                        <p className="text-sm font-bold mb-1">Payment Successful</p>
                        <p className="text-xs text-slate-500">Your Mobile bill payment of ₹666 was successful.</p>
                      </div>
                    </div>
                    <button className="w-full p-3 text-xs font-bold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-colors">
                      View All Notifications
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                {user?.displayName?.[0] || user?.email?.[0].toUpperCase()}
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-sm font-bold leading-tight">{user?.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-medium">{user?.role || 'Member'}</p>
              </div>
              <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-300", isProfileOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-5 border-b dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white">{user?.displayName || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <User size={18} />
                        My Profile
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <Settings size={18} />
                        Settings
                      </Link>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight">SmartBill</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsNotifOpen(true)} className="p-2 text-slate-400 relative">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={cn(
                "fixed lg:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r dark:border-slate-800 z-50 p-6 flex flex-col transition-all duration-300",
                !isSidebarOpen && "hidden lg:flex"
              )}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <span className="font-bold text-2xl tracking-tight">SmartBill</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.to}
                    {...item}
                    active={location.pathname === item.to}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t dark:border-slate-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Global Footer for Razorpay Compliance */}
          <footer className={cn(
            "p-8 border-t dark:border-slate-800 mt-auto",
            theme === 'dark' ? "bg-slate-900/50" : "bg-white"
          )}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <span className="font-bold text-lg tracking-tight">SmartBill</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  SmartBill Solutions Pvt Ltd<br />
                  123, Tech Park, Outer Ring Road<br />
                  Bangalore, Karnataka, India - 560001
                </p>
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Support</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Email: yaksinik@gmail.com<br />
                  Phone: +91 98765 43210
                </p>
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Legal</h4>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-emerald-500">
                  <Link to="/about" className="hover:underline">About Us</Link>
                  <Link to="/contact" className="hover:underline">Contact Us</Link>
                  <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
                  <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
                  <Link to="/refund" className="hover:underline">Refund Policy</Link>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto mt-8 pt-8 border-t dark:border-slate-800 text-center text-xs text-slate-400">
              © 2026 SmartBill Solutions Pvt Ltd. All rights reserved.
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // Listen for real-time user data updates
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          let userData = snapshot.exists() ? snapshot.data() : {};
          
          // Force admin role for the owner email
          if (firebaseUser.email === 'yaksinik@gmail.com') {
            userData.role = 'admin';
          }
          
          const fullUser = { ...firebaseUser, ...userData };
          console.log("User data updated:", fullUser);
          setUser(fullUser);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setUser(firebaseUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <UserContext.Provider value={{ user, loading }}>
        <Router>
          <Routes>
            <Route path="/auth" element={!user ? <AuthPage /> : (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/" />)} />
            <Route path="/" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Layout><Dashboard /></Layout>) : <Navigate to="/auth" />} />
            <Route path="/pay" element={user ? <Layout><PayBill /></Layout> : <Navigate to="/auth" />} />
            <Route path="/history" element={user ? <Layout><PaymentHistory /></Layout> : <Navigate to="/auth" />} />
            <Route path="/profile" element={user ? <Layout><Profile /></Layout> : <Navigate to="/auth" />} />
            <Route path="/support" element={user ? <Layout><Support /></Layout> : <Navigate to="/auth" />} />
            <Route path="/settings" element={user ? <Layout><SettingsPage /></Layout> : <Navigate to="/auth" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Layout><AdminDashboard /></Layout> : <Navigate to="/" />} />
            
            {/* Public Legal Routes */}
            <Route path="/privacy" element={<LegalPage />} />
            <Route path="/terms" element={<LegalPage />} />
            <Route path="/refund" element={<LegalPage />} />
            <Route path="/contact" element={<LegalPage />} />
            <Route path="/about" element={<LegalPage />} />
          </Routes>
        </Router>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}
