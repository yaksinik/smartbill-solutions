import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { 
  Smartphone, 
  Zap, 
  Droplets, 
  Wifi, 
  Tv, 
  Flame, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  PartyPopper,
  X,
  Activity,
  Download,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../firebase';

declare var Razorpay: any;

const PROVIDERS = {
  Mobile: [
    { name: 'Reliance Jio', icon: Smartphone, plans: [
      { name: 'Jio Freedom', data: '1.5GB/Day', validity: '28 Days', price: 299 },
      { name: 'Jio Popular', data: '2GB/Day', validity: '84 Days', price: 749 },
      { name: 'Jio Annual', data: '2.5GB/Day', validity: '365 Days', price: 2999 }
    ]},
    { name: 'Airtel', icon: Smartphone, plans: [
      { name: 'Airtel Basic', data: '1GB/Day', validity: '24 Days', price: 265 },
      { name: 'Airtel Truly Unlimited', data: '1.5GB/Day', validity: '28 Days', price: 299 },
      { name: 'Airtel Mega', data: '3GB/Day', validity: '56 Days', price: 699 }
    ]},
    { name: 'Vi', icon: Smartphone, plans: [
      { name: 'Vi Hero', data: '1.5GB/Day', validity: '28 Days', price: 299 },
      { name: 'Vi Unlimited', data: '2GB/Day', validity: '56 Days', price: 539 },
      { name: 'Vi Annual', data: '1.5GB/Day', validity: '365 Days', price: 2899 }
    ]},
    { name: 'BSNL', icon: Smartphone, plans: [
      { name: 'BSNL Voice', data: '2GB/Day', validity: '28 Days', price: 187 },
      { name: 'BSNL Data', data: '3GB/Day', validity: '30 Days', price: 247 }
    ]}
  ],
  Electricity: [
    { name: 'BESCOM (Bengaluru)', icon: Zap },
    { name: 'TATA Power (Mumbai)', icon: Zap },
    { name: 'Adani Electricity', icon: Zap },
    { name: 'MSEB (Maharashtra)', icon: Zap },
    { name: 'BSES Yamuna', icon: Zap }
  ],
  Water: [
    { name: 'BWSSB (Bengaluru)', icon: Droplets },
    { name: 'DJB (Delhi)', icon: Droplets },
    { name: 'MCGM (Mumbai)', icon: Droplets },
    { name: 'HMWSSB (Hyderabad)', icon: Droplets }
  ],
  'Gas Bill': [
    { name: 'Indane Gas', icon: Flame },
    { name: 'HP Gas', icon: Flame },
    { name: 'Bharat Gas', icon: Flame },
    { name: 'Adani Gas', icon: Flame }
  ],
  Internet: [
    { name: 'Airtel Xstream', icon: Wifi, plans: [
      { name: 'Basic', speed: '40Mbps', price: 499 },
      { name: 'Standard', speed: '100Mbps', price: 799 },
      { name: 'Entertainment', speed: '200Mbps', price: 999 },
      { name: 'Professional', speed: '300Mbps', price: 1499 }
    ]},
    { name: 'JioFiber', icon: Wifi, plans: [
      { name: 'Bronze', speed: '30Mbps', price: 399 },
      { name: 'Silver', speed: '100Mbps', price: 699 },
      { name: 'Gold', speed: '150Mbps', price: 999 }
    ]},
    { name: 'ACT Fibernet', icon: Wifi, plans: [
      { name: 'ACT Basic', speed: '40Mbps', price: 549 },
      { name: 'ACT Silver', speed: '100Mbps', price: 710 }
    ]}
  ],
  DTH: [
    { name: 'Tata Play', icon: Tv },
    { name: 'Airtel Digital TV', icon: Tv },
    { name: 'Dish TV', icon: Tv },
    { name: 'Sun Direct', icon: Tv }
  ],
  Maintenance: [
    { name: 'Apartment Maintenance', icon: Activity },
    { name: 'Society Charges', icon: Activity },
    { name: 'Clubhouse Fee', icon: Activity }
  ]
};

const BillCard = ({ bill, onSelect, active }: { bill: any; onSelect: () => void; active: boolean; key?: any }) => {
  const iconMap = {
    Mobile: Smartphone,
    Electricity: Zap,
    Water: Droplets,
    Internet: Wifi,
    Broadband: Wifi,
    DTH: Tv,
    'Gas Bill': Flame,
    Gas: Flame,
    Maintenance: Activity
  };
  
  const Icon = iconMap[bill.type as keyof typeof iconMap] || CreditCard;

  const isLate = new Date(bill.dueDate) < new Date();

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onSelect}
      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${
        active 
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" 
          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-200"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${active ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          <Icon size={24} />
        </div>
        {isLate && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-red-100 text-red-600 rounded-full uppercase tracking-wider">
            <AlertTriangle size={10} />
            Overdue
          </div>
        )}
      </div>
      <h3 className="font-bold text-lg mb-1">{bill.type}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{bill.provider}</p>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">Due Date</p>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Calendar size={14} className="text-slate-400" />
            {new Date(bill.dueDate).toLocaleDateString()}
          </div>
        </div>
        <p className="text-2xl font-bold text-emerald-600">₹{bill.amount}</p>
      </div>
    </motion.div>
  );
};

export default function PayBill() {
  const { user } = useUser();
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | null>(null);
  const [payingMember, setPayingMember] = useState(user?.displayName || '');
  const [showPlans, setShowPlans] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidBill, setPaidBill] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Mobile specific
  const [mobileNumber, setMobileNumber] = useState('');
  const [network, setNetwork] = useState('');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [consumerId, setConsumerId] = useState('');
  const [isFetchingBill, setIsFetchingBill] = useState(false);
  const [fetchedBillAmount, setFetchedBillAmount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.displayName && !payingMember) {
      setPayingMember(user.displayName);
    }
  }, [user?.displayName, payingMember]);

  useEffect(() => {
    if (!user?.uid) return;

    // Query for family bills if user has a familyId
    const familyQuery = user.familyId 
      ? query(
          collection(db, 'bills'),
          where('familyId', '==', user.familyId)
        )
      : null;

    // Query for personal bills
    const personalQuery = query(
      collection(db, 'bills'),
      where('userId', '==', user.uid)
    );

    const handleSnapshot = (snapshot: any, source: 'family' | 'personal') => {
      const newBills = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data(), source }))
        .filter((bill: any) => bill.status === 'unpaid');
      setBills(prev => {
        const filtered = prev.filter(b => (b as any).source !== source);
        const combined = [...filtered, ...newBills];
        // Remove duplicates by ID
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    };

    const unsubscribePersonal = onSnapshot(personalQuery, (s) => handleSnapshot(s, 'personal'));
    let unsubscribeFamily: (() => void) | null = null;
    
    if (familyQuery) {
      unsubscribeFamily = onSnapshot(familyQuery, (s) => handleSnapshot(s, 'family'));
    }

    return () => {
      unsubscribePersonal();
      if (unsubscribeFamily) unsubscribeFamily();
    };
  }, [user?.uid, user?.familyId]);

  const fetchBill = async () => {
    if (!consumerId) return;
    setIsFetchingBill(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    const randomAmount = Math.floor(Math.random() * (5000 - 300 + 1)) + 300;
    setFetchedBillAmount(randomAmount);
    setAmount(randomAmount.toString());
    setIsFetchingBill(false);
  };

  const completePayment = async (method: string, razorpayPaymentId?: string) => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const billToPay = selectedBill || {
        id: `TEMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        type: selectedCategory,
        provider: selectedProvider?.name,
        amount: parseFloat(amount),
        status: 'paid',
        planDetails: (selectedCategory === 'Mobile' || selectedCategory === 'Internet') 
          ? `Plan: ₹${amount}` 
          : `Consumer ID: ${consumerId}`
      };

      const paymentData = {
        id: Math.random().toString(36).substr(2, 9),
        billId: billToPay.id,
        userId: user.uid,
        familyId: user.familyId || null,
        memberName: payingMember,
        billType: billToPay.type,
        provider: billToPay.provider,
        mobileNumber: (billToPay.type === 'Mobile' || selectedCategory === 'Mobile') ? mobileNumber : null,
        network: (billToPay.type === 'Mobile' || selectedCategory === 'Mobile') ? network : null,
        amount: billToPay.amount,
        method: method,
        razorpayPaymentId: razorpayPaymentId || null,
        timestamp: new Date().toISOString(),
      };

      console.log("Saving payment data:", paymentData);
      await addDoc(collection(db, 'payments'), paymentData);
      
      if (selectedBill) {
        await updateDoc(doc(db, 'bills', selectedBill.id), { status: 'paid' });
      }
      
      setPaidBill(paymentData); // Use paymentData for receipt to ensure it has the ID and timestamp
      setIsPaid(true);
      setStep(4);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if ((!selectedBill && !selectedCategory) || !paymentMethod) return;
    
    setLoading(true);
    try {
      const billAmount = selectedBill ? selectedBill.amount : parseFloat(amount);
      
      // 1. Create order on server
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: billAmount }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create Razorpay order");
      }
      
      const order = await response.json();

      // 2. Open Razorpay Checkout
      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "SmartBill",
        description: `Payment for ${selectedBill?.type || selectedCategory} - ${selectedBill?.provider || selectedProvider?.name}`,
        order_id: order.id,
        handler: function (response: any) {
          completePayment('razorpay', response.razorpay_payment_id);
        },
        prefill: {
          name: payingMember,
          email: user.email,
          contact: mobileNumber || ""
        },
        theme: {
          color: "#10b981"
        }
      };

      // If UPI/QR is selected, force the UPI QR flow
      if (paymentMethod === 'upi') {
        options.method = 'upi';
        options.upi = {
          flow: 'qr'
        };
      } else if (paymentMethod === 'card') {
        options.method = 'card';
      } else if (paymentMethod === 'netbanking') {
        options.method = 'netbanking';
      }

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed to initialize. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const currentBillDetails = selectedBill ? {
    type: selectedBill.type,
    provider: selectedBill.provider,
    amount: selectedBill.amount,
    planDetails: selectedBill.planDetails
  } : {
    type: selectedCategory,
    provider: selectedProvider?.name,
    amount: parseFloat(amount || '0'),
    planDetails: (selectedCategory === 'Mobile' || selectedCategory === 'Internet') 
      ? `Plan: ₹${amount}` 
      : `Consumer ID: ${consumerId}`
  };

  if (isPaid && paidBill) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
        >
          <div className="bg-emerald-500 p-8 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 size={40} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-1">Payment Successful</h2>
            <p className="text-emerald-100 text-sm">Transaction ID: TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                    {(paidBill.billType === 'Mobile') && <Smartphone size={20} />}
                    {(paidBill.billType === 'Electricity') && <Zap size={20} />}
                    {(paidBill.billType === 'Water') && <Droplets size={20} />}
                    {(paidBill.billType === 'Internet' || paidBill.billType === 'Broadband') && <Wifi size={20} />}
                    {(paidBill.billType === 'DTH') && <Tv size={20} />}
                    {(paidBill.billType === 'Gas Bill' || paidBill.billType === 'Gas') && <Flame size={20} />}
                    {(paidBill.billType === 'Maintenance') && <Activity size={20} />}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bill Type</p>
                    <p className="font-bold">{paidBill.billType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Amount Paid</p>
                  <p className="text-2xl font-black text-emerald-600">₹{paidBill.amount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Provider</p>
                  <p className="font-bold">{paidBill.provider}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Paid By</p>
                  <p className="font-bold">{payingMember}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Date</p>
                  <p className="font-bold">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Method</p>
                  <p className="font-bold uppercase">{paymentMethod}</p>
                </div>
              </div>

              {paidBill.razorpayPaymentId && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Razorpay ID</p>
                  <p className="text-sm font-medium">{paidBill.razorpayPaymentId}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => window.location.href = '/history'}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Receipt
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Powered by SmartBill Secure Payment</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>1</div>
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>2</div>
        <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>3</div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            {/* Pending Bills Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <AlertTriangle size={24} className="text-amber-500" />
                  Unpaid Bills
                </h2>
                <span className="text-sm font-bold bg-amber-100 text-amber-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  {bills.length} Pending
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bills.map((bill) => (
                  <BillCard 
                    key={bill.id} 
                    bill={bill} 
                    onSelect={() => {
                      setSelectedBill(bill);
                      setSelectedCategory(null);
                    }} 
                    active={selectedBill?.id === bill.id} 
                  />
                ))}
                {bills.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500 opacity-20" />
                    <p className="text-slate-500">All bills are paid! You're all caught up.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Pay Categories Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Zap size={24} className="text-emerald-500" />
                  Quick Pay Categories
                </h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(PROVIDERS).map(([category, providers]) => {
                  const Icon = {
                    Mobile: Smartphone,
                    Electricity: Zap,
                    Water: Droplets,
                    Internet: Wifi,
                    DTH: Tv,
                    'Gas Bill': Flame,
                    Maintenance: Activity
                  }[category as keyof typeof PROVIDERS] || CreditCard;

                  return (
                    <motion.div
                      key={category}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedBill(null);
                        setSelectedProvider(null);
                        setAmount('');
                      }}
                      className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                        selectedCategory === category 
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" 
                          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-200"
                      }`}
                    >
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                        selectedCategory === category ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        <Icon size={24} />
                      </div>
                      <p className="text-xs font-bold truncate">{category}</p>
                    </motion.div>
                  );
                })}
              </div>

              {selectedCategory && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Select Provider</label>
                      <div className="grid grid-cols-1 gap-2">
                        {PROVIDERS[selectedCategory as keyof typeof PROVIDERS].map((provider: any) => (
                          <button
                            key={provider.name}
                            onClick={() => {
                              setSelectedProvider(provider);
                              setFetchedBillAmount(null);
                              setAmount('');
                              setConsumerId('');
                              if (selectedCategory === 'Mobile') {
                                setNetwork(provider.name);
                              }
                            }}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              selectedProvider?.name === provider.name
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                                : "border-slate-100 dark:border-slate-800 hover:border-emerald-200"
                            }`}
                          >
                            <span className="font-bold">{provider.name}</span>
                            <ChevronRight size={18} className={selectedProvider?.name === provider.name ? "text-emerald-500" : "text-slate-400"} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {selectedProvider && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                          {selectedCategory === 'Mobile' && (
                            <div className="space-y-2">
                              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                              <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                  type="tel"
                                  value={mobileNumber}
                                  onChange={(e) => setMobileNumber(e.target.value)}
                                  placeholder="Enter 10-digit number"
                                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                              </div>
                            </div>
                          )}

                          {(selectedCategory === 'Mobile' || selectedCategory === 'Internet') ? (
                            <div className="space-y-4">
                              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Select Plan</label>
                              <div className="grid grid-cols-1 gap-3">
                                {selectedProvider.plans.map((plan: any) => (
                                  <button
                                    key={plan.name}
                                    onClick={() => setAmount(plan.price.toString())}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                      amount === plan.price.toString()
                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                                        : "border-slate-100 dark:border-slate-800 hover:border-emerald-200"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold">{plan.name}</span>
                                      <span className="text-lg font-bold text-emerald-600">₹{plan.price}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      {plan.data ? `${plan.data} • ${plan.validity}` : plan.speed}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Consumer ID / Account No.</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={consumerId}
                                  onChange={(e) => setConsumerId(e.target.value)}
                                  placeholder="Enter ID"
                                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                                <button 
                                  onClick={fetchBill}
                                  disabled={!consumerId || isFetchingBill}
                                  className="px-6 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50"
                                >
                                  {isFetchingBill ? '...' : 'Fetch'}
                                </button>
                              </div>
                              
                              {fetchedBillAmount !== null && (
                                <motion.div 
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-center"
                                >
                                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Bill Amount Found</p>
                                  <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">₹{fetchedBillAmount}</p>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {(selectedBill || (selectedCategory && selectedProvider && amount && (selectedCategory !== 'Mobile' || mobileNumber.length === 10))) && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Payer Information</h2>
              <p className="text-slate-500">Who is making this payment?</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-md mx-auto">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Member Name</label>
                <input 
                  type="text" 
                  value={payingMember}
                  onChange={(e) => setPayingMember(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />

                {(selectedBill?.type === 'Mobile' && !selectedBill.mobileNumber) && (
                  <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mobile Number</label>
                      <input 
                        type="tel" 
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Network</label>
                      <select 
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      >
                        <option value="">Select Operator</option>
                        {PROVIDERS.Mobile.map(p => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Bill Summary</h3>
                    {(selectedBill?.type === 'Mobile' || selectedCategory === 'Mobile' || selectedBill?.type === 'Internet' || selectedCategory === 'Internet') && (
                      <button 
                        onClick={() => setShowPlans(true)}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Change Plan
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      {currentBillDetails.type} ({currentBillDetails.provider})
                    </span>
                    <span className="font-bold">₹{currentBillDetails.amount}</span>
                  </div>
                  {(currentBillDetails.type === 'Mobile' || currentBillDetails.type === 'Internet') && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-sm">
                      <p className="font-bold mb-1">Current Plan</p>
                      <p>{currentBillDetails.planDetails || 'Unlimited Calls + 2GB/Day (28 Days)'}</p>
                    </div>
                  )}
                </div>

                {/* Plans Modal */}
                <AnimatePresence>
                  {showPlans && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPlans(false)}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[80vh]"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-bold">Available Plans</h3>
                          <button onClick={() => setShowPlans(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X size={20} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {((PROVIDERS[(selectedBill?.type || selectedCategory) as keyof typeof PROVIDERS] as any)?.find((p: any) => p.name === (selectedBill?.provider || selectedProvider?.name))?.plans?.map((plan: any) => (
                            <div 
                              key={plan.name}
                              onClick={() => {
                                if (selectedBill) {
                                  setSelectedBill({ ...selectedBill, amount: plan.price, planDetails: plan.data ? `${plan.data} + Unlimited Calls (${plan.validity})` : `${plan.speed} Unlimited Data` });
                                } else {
                                  setAmount(plan.price.toString());
                                }
                                setShowPlans(false);
                              }}
                              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition-all group"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-bold group-hover:text-emerald-600 transition-colors">{plan.name} Plan</p>
                                  <p className="text-sm text-slate-500">{plan.data || plan.speed} {plan.validity ? `• ${plan.validity}` : ''}</p>
                                </div>
                                <p className="text-xl font-bold">₹{plan.price}</p>
                              </div>
                            </div>
                          ))) || (
                            <div className="text-center py-8 text-slate-500">
                              <p>No specific plans available for this provider.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">Back</button>
              <button 
                onClick={() => setStep(3)}
                disabled={!payingMember}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                Choose Payment Method <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Payment Method</h2>
              <p className="text-slate-500">Securely pay your bill using UPI or Card.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button 
                onClick={() => setPaymentMethod('upi')}
                className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${paymentMethod === 'upi' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
              >
                <QrCode size={40} className={paymentMethod === 'upi' ? 'text-emerald-500' : 'text-slate-400'} />
                <div className="text-center">
                  <p className="font-bold">UPI / QR</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Instant</p>
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('card')}
                className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
              >
                <CreditCard size={40} className={paymentMethod === 'card' ? 'text-emerald-500' : 'text-slate-400'} />
                <div className="text-center">
                  <p className="font-bold">Card</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Secure</p>
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('netbanking')}
                className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${paymentMethod === 'netbanking' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Globe size={24} className={paymentMethod === 'netbanking' ? 'text-emerald-500' : 'text-slate-400'} />
                </div>
                <div className="text-center">
                  <p className="font-bold">Net Banking</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">All Banks</p>
                </div>
              </button>
            </div>

            {paymentMethod === 'netbanking' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto space-y-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-500 mb-4 px-1">Select your Bank</p>
                  <select className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>SBI</option>
                    <option>Axis Bank</option>
                    <option>Kotak Bank</option>
                  </select>
                </div>
              </motion.div>
            )}

            {paymentMethod === 'upi' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SmartBillPayment" alt="UPI QR" className="w-48 h-48" />
                </div>
                <p className="text-sm text-slate-500">Scan this QR code with any UPI app to pay ₹{currentBillDetails.amount}</p>
              </motion.div>
            )}

            {paymentMethod === 'card' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto space-y-4">
                <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                  <input 
                    type="text" 
                    placeholder="Card Number" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                    <input 
                      type="password" 
                      placeholder="CVV" 
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">Back</button>
              <button 
                onClick={handlePayment}
                disabled={!paymentMethod || loading}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Pay ₹${currentBillDetails.amount}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
