import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { 
  Search, 
  Download, 
  FileText, 
  ChevronRight, 
  Calendar, 
  User, 
  CreditCard,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { handleFirestoreError, OperationType } from '../firebase';

export default function PaymentHistory() {
  const { user } = useUser();
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const handleSnapshot = (snapshot: any, source: 'family' | 'personal') => {
      console.log(`Fetched ${snapshot.docs.length} ${source} payments`);
      const newPayments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data(), source }));
      setPayments(prev => {
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
      setLoading(false);
    };

    const handleError = (err: any) => {
      handleFirestoreError(err, OperationType.GET, 'payments');
      setLoading(false);
    };

    // Personal payments
    const personalQuery = query(
      collection(db, 'payments'),
      where('userId', '==', user.uid)
    );

    const unsubscribePersonal = onSnapshot(personalQuery, (s) => handleSnapshot(s, 'personal'), handleError);

    // Family payments
    let unsubscribeFamily: (() => void) | null = null;
    if (user.familyId) {
      const familyQuery = query(
        collection(db, 'payments'),
        where('familyId', '==', user.familyId)
      );
      unsubscribeFamily = onSnapshot(familyQuery, (s) => handleSnapshot(s, 'family'), handleError);
    }

    return () => {
      unsubscribePersonal();
      if (unsubscribeFamily) unsubscribeFamily();
    };
  }, [user?.uid, user?.familyId]);

  const filteredPayments = payments.filter(p => 
    p.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.billType && p.billType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.amount.toString().includes(searchTerm) ||
    p.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadReceipt = (payment: any) => {
    const doc = new jsPDF();
    
    // Logo
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.roundedRect(10, 10, 15, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('SB', 14, 20);

    // Header
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFontSize(20);
    doc.text('SmartBill Receipt', 30, 21);
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(10, 30, 200, 30);

    // Details
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Transaction ID:', 10, 45);
    doc.setTextColor(30, 41, 59);
    doc.text(`TXN-${payment.id.toUpperCase()}`, 60, 45);

    doc.setTextColor(100, 116, 139);
    doc.text('Date & Time:', 10, 55);
    doc.setTextColor(30, 41, 59);
    doc.text(new Date(payment.timestamp).toLocaleString(), 60, 55);

    doc.setTextColor(100, 116, 139);
    doc.text('Paid By:', 10, 65);
    doc.setTextColor(30, 41, 59);
    doc.text(payment.memberName, 60, 65);

    doc.setTextColor(100, 116, 139);
    doc.text('Bill Type:', 10, 75);
    doc.setTextColor(30, 41, 59);
    doc.text(payment.billType || 'N/A', 60, 75);

    doc.setTextColor(100, 116, 139);
    doc.text('Payment Method:', 10, 85);
    doc.setTextColor(30, 41, 59);
    doc.text(payment.method.toUpperCase(), 60, 85);

    doc.line(10, 95, 200, 95);

    // Amount
    doc.setFontSize(16);
    doc.text('Total Amount Paid:', 10, 110);
    doc.setTextColor(16, 185, 129);
    doc.text(`INR ${payment.amount.toLocaleString()}`, 150, 110);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer generated receipt and does not require a signature.', 10, 280);

    doc.save(`SmartBill_Receipt_${payment.id}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Payment History</h1>
          <p className="text-slate-500 dark:text-slate-400">View and download receipts for all your past payments.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by member name, amount, or method..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
          <Filter size={20} />
          Filter
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bill Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Paid By</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredPayments.map((payment) => (
                <motion.tr 
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{new Date(payment.timestamp).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400">{new Date(payment.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {payment.billType || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="font-medium text-sm">{payment.memberName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CreditCard size={14} />
                      <span className="uppercase">{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-emerald-600">₹{payment.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => downloadReceipt(payment)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                    >
                      <Download size={14} />
                      Receipt
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredPayments.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-10" />
                    <p>No payments found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
