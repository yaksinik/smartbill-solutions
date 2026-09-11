import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { 
  TrendingUp, 
  CreditCard, 
  History, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../firebase';

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: string; icon: any; color: string; trend?: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
  </motion.div>
);

export default function Dashboard() {
  const { user } = useUser();
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const handlePaymentsSnapshot = (snapshot: any, source: 'family' | 'personal') => {
      console.log(`Fetched ${snapshot.docs.length} ${source} payments for dashboard`);
      const newPayments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data(), source }));
      setAllPayments(prev => {
        const filtered = prev.filter(p => p.source !== source);
        const combined = [...filtered, ...newPayments];
        // Deduplicate by ID
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        // Sort by timestamp desc
        return unique.sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tB - tA;
        });
      });
    };

    const handlePaymentsError = (err: any) => {
      handleFirestoreError(err, OperationType.GET, 'payments');
    };

    // Personal payments
    const personalPaymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', user.uid)
    );

    const unsubscribePersonalPayments = onSnapshot(personalPaymentsQuery, (s) => handlePaymentsSnapshot(s, 'personal'), handlePaymentsError);

    // Family payments
    let unsubscribeFamilyPayments: (() => void) | null = null;
    if (user.familyId) {
      const familyPaymentsQuery = query(
        collection(db, 'payments'),
        where('familyId', '==', user.familyId)
      );
      unsubscribeFamilyPayments = onSnapshot(familyPaymentsQuery, (s) => handlePaymentsSnapshot(s, 'family'), handlePaymentsError);
    }

    // Pending Bills
    const familyBillsQuery = user.familyId
      ? query(
          collection(db, 'bills'),
          where('familyId', '==', user.familyId)
        )
      : null;

    const personalBillsQuery = query(
      collection(db, 'bills'),
      where('userId', '==', user.uid)
    );

    const handleBillsSnapshot = (snapshot: any, source: 'family' | 'personal') => {
      const newBills = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data(), source }))
        .filter((bill: any) => bill.status === 'unpaid');
      setPendingBills(prev => {
        const filtered = prev.filter(b => (b as any).source !== source);
        const combined = [...filtered, ...newBills];
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    };

    const unsubscribePersonalBills = onSnapshot(personalBillsQuery, (s) => handleBillsSnapshot(s, 'personal'));
    let unsubscribeFamilyBills: (() => void) | null = null;
    if (familyBillsQuery) {
      unsubscribeFamilyBills = onSnapshot(familyBillsQuery, (s) => handleBillsSnapshot(s, 'family'));
    }

    return () => {
      unsubscribePersonalPayments();
      if (unsubscribeFamilyPayments) unsubscribeFamilyPayments();
      unsubscribePersonalBills();
      if (unsubscribeFamilyBills) unsubscribeFamilyBills();
    };
  }, [user?.uid, user?.familyId]);

  useEffect(() => {
    // Update lastPayment and totalSpent whenever allPayments changes
    if (allPayments.length > 0) {
      setLastPayment(allPayments[0]);
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startIso = startOfMonth.toISOString();
      
      const total = allPayments
        .filter(p => p.timestamp && p.timestamp >= startIso)
        .reduce((acc, p) => acc + p.amount, 0);
      setTotalSpent(total);
    }
  }, [allPayments]);

  const billsByCategory = pendingBills.reduce((acc: any, bill) => {
    acc[bill.type] = (acc[bill.type] || 0) + bill.amount;
    return acc;
  }, {});

  const chartData = Object.entries(billsByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back, {user?.displayName}!</h1>
          <p className="text-slate-500 dark:text-slate-400">Here's what's happening with your family bills.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/history"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 transition-all"
          >
            <History size={20} />
            History
          </Link>
          <Link 
            to="/pay"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <CreditCard size={20} />
            Pay a Bill
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Monthly Spending" 
          value={`₹${totalSpent.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
          trend="+12.5%" 
        />
        <StatCard 
          title="Pending Bills" 
          value={pendingBills.length.toString()} 
          icon={AlertCircle} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Last Payment" 
          value={lastPayment ? `₹${lastPayment.amount.toLocaleString()}` : 'No data'} 
          icon={CheckCircle2} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Active Members" 
          value="4" 
          icon={User} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bill Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 size={24} className="text-emerald-500" />
              Pending Bills Breakdown
            </h2>
          </div>
          
          {pendingBills.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-slate-500">
              <CheckCircle2 size={48} className="mb-4 opacity-20" />
              <p>No pending bills to display.</p>
            </div>
          )}
        </div>

        {/* Quick Access */}
        <div className="bg-emerald-500 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Quick Pay</h2>
            <p className="text-emerald-50 opacity-90 mb-8">You have {pendingBills.length} unpaid bills. Settle them now to avoid late fees.</p>
            
            <div className="space-y-4">
              {pendingBills.slice(0, 2).map((bill) => (
                <div key={bill.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold">{bill.type}</p>
                    <p className="text-xs bg-white/20 px-2 py-1 rounded-full">{bill.provider}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-2xl font-bold">₹{bill.amount}</p>
                    <Link to="/pay" className="text-sm font-bold bg-white text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors">Pay Now</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
