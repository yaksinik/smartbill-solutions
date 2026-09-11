import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Mail, Lock, Phone, User, ArrowRight, Shield, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        const userData = userDoc.data();
        const isOwner = userCredential.user.email === 'yaksinik@gmail.com';
        
        if (isAdmin && userData?.role !== 'admin' && !isOwner) {
          await auth.signOut();
          throw new Error('This account does not have admin privileges.');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        const userData = {
          uid: userCredential.user.uid,
          email,
          phone,
          displayName,
          role: isAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userCredential.user.uid}`);
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in your Firebase Console. Please enable it under Authentication > Sign-in method.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left Side: Branding & Features (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[120px] animate-pulse delay-700" />
        </div>
        
        <div className="relative z-10 max-w-lg text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl text-white shadow-2xl shadow-emerald-500/40 mb-8">
              <Zap size={32} fill="currentColor" />
            </div>
            <h1 className="text-6xl font-bold tracking-tight mb-6 leading-tight">
              Manage your <span className="text-emerald-400">Bills</span> smarter.
            </h1>
            <p className="text-xl text-slate-400 mb-12 leading-relaxed">
              The all-in-one platform for tracking, paying, and managing your household expenses with ease and transparency.
            </p>
            
            <div className="space-y-6">
              {[
                { icon: <Zap size={20} />, title: 'Real-time Tracking', desc: 'Monitor your expenses as they happen.' },
                { icon: <Shield size={20} />, title: 'Secure Payments', desc: 'Bank-grade security for all your transactions.' },
                { icon: <ArrowRight size={20} />, title: 'Family Sharing', desc: 'Collaborate with your household effortlessly.' }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 p-2 bg-slate-800 rounded-lg text-emerald-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-slate-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Rail Text */}
        <div className="absolute bottom-12 left-12 flex items-center gap-4 text-slate-500 font-mono text-xs tracking-widest uppercase">
          <div className="w-12 h-px bg-slate-800" />
          <span>SmartBill v2.0</span>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20 mb-4">
              <Zap size={24} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white">SmartBill</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {isAdmin ? (isLogin ? 'Admin Login' : 'Admin Registration') : (isLogin ? 'Welcome Back' : 'Get Started')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isLogin ? 'Enter your credentials to access your account.' : 'Create your account to start managing your bills.'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 dark:bg-slate-950 px-4 text-slate-500 font-medium tracking-wider">Or continue with</span>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-600 dark:text-slate-400 font-medium hover:text-emerald-500 transition-colors"
              >
                {isLogin ? (
                  <>Don't have an account? <span className="text-emerald-500 font-bold">Sign Up</span></>
                ) : (
                  <>Already have an account? <span className="text-emerald-500 font-bold">Sign In</span></>
                )}
              </button>
            </div>
            
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  setIsAdmin(!isAdmin);
                  setIsLogin(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
              >
                {isAdmin ? (
                  <><User size={16} /> Switch to User Portal</>
                ) : (
                  <><Shield size={16} /> Switch to Admin Portal</>
                )}
              </button>
              
              {/* Business Info for Razorpay Verification */}
              <div className="mt-8 text-center space-y-4">
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Link to="/about" className="hover:text-emerald-500 transition-colors">About Us</Link>
                  <Link to="/contact" className="hover:text-emerald-500 transition-colors">Contact Us</Link>
                  <Link to="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
                  <Link to="/terms" className="hover:text-emerald-500 transition-colors">Terms & Conditions</Link>
                  <Link to="/refund" className="hover:text-emerald-500 transition-colors">Refund Policy</Link>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  <p>SmartBill Solutions Pvt Ltd</p>
                  <p>Support: yaksinik@gmail.com | +91 98765 43210</p>
                  <p>Address: 123, Tech Park, Bangalore, KA, India - 560001</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold pt-4">
                Secure Authentication Powered by Firebase
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
