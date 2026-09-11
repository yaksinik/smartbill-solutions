import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, onSnapshot, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../firebase';

export default function Profile() {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(user);
  const [family, setFamily] = useState<any>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfile(userData);
        
        if (userData.familyId) {
          const familyRef = doc(db, 'families', userData.familyId);
          const familySnap = await getDoc(familyRef);
          if (familySnap.exists()) {
            setFamily(familySnap.data());
          }
        }
      } else {
        // Initialize user document if it doesn't exist
        const initialData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          role: user.email === 'yaksinik@gmail.com' ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, initialData);
        setProfile(initialData);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [user?.uid]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        phone: profile.phone,
        address: profile.address,
      });
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    setLoading(true);
    const familyId = `FAM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    try {
      const familyData = {
        id: familyId,
        primaryUserId: user.uid,
        members: [user.uid],
      };
      await setDoc(doc(db, 'families', familyId), familyData);
      await updateDoc(doc(db, 'users', user.uid), { familyId });

      // Seed some initial bills for the demo
      const initialBills = [
        { type: 'Mobile', provider: 'Reliance Jio', amount: 749, dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), status: 'unpaid', planDetails: '2GB/Day + Unlimited Calls (84 Days)' },
        { type: 'Electricity', provider: 'BESCOM (Bengaluru)', amount: 1240, dueDate: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'unpaid' },
        { type: 'Internet', provider: 'Airtel Xstream', amount: 799, dueDate: new Date(Date.now() + 15 * 86400000).toISOString(), status: 'unpaid', planDetails: '100Mbps Unlimited Data' },
        { type: 'Water', provider: 'BWSSB (Bengaluru)', amount: 450, dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'unpaid' },
        { type: 'DTH', provider: 'Tata Play', amount: 350, dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), status: 'unpaid' },
        { type: 'Gas Bill', provider: 'Indane Gas', amount: 1050, dueDate: new Date(Date.now() + 12 * 86400000).toISOString(), status: 'unpaid' },
        { type: 'Maintenance', provider: 'Apartment Maintenance', amount: 3500, dueDate: new Date(Date.now() + 20 * 86400000).toISOString(), status: 'unpaid' }
      ];

      for (const bill of initialBills) {
        const billId = `BILL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await setDoc(doc(db, 'bills', billId), { ...bill, id: billId, familyId });
      }

      setFamily(familyData);
      setProfile({ ...profile, familyId });
      setMessage({ text: 'Family group created with initial bills!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `families/${familyId}`);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMemberEmail || !family) return;
    setLoading(true);
    // In a real app, we'd search for the user by email. 
    // For this demo, we'll just add the email string to the members list.
    try {
      await updateDoc(doc(db, 'families', family.id), {
        members: arrayUnion(newMemberEmail)
      });
      setFamily({ ...family, members: [...family.members, newMemberEmail] });
      setNewMemberEmail('');
      setMessage({ text: 'Member added successfully!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `families/${family.id}`);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberEmail: string) => {
    if (!family) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'families', family.id), {
        members: arrayRemove(memberEmail)
      });
      setFamily({ ...family, members: family.members.filter((m: string) => m !== memberEmail) });
      setMessage({ text: 'Member removed.', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `families/${family.id}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Your Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your personal information and family group.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-bold border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Personal Information</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Update your basic details.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={profile?.displayName || ''}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={profile?.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={profile?.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Home Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea 
                    rows={3}
                    value={profile?.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Enter your full address"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Family Management */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Family Group</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Share bills with your family.</p>
              </div>
            </div>

            {!family ? (
              <div className="text-center py-6 space-y-4">
                <p className="text-sm text-slate-500">You are not part of any family group yet.</p>
                <button 
                  onClick={createFamily}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
                >
                  <Plus size={18} />
                  Create Family
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Family ID</p>
                  <p className="font-mono font-bold text-blue-600">{family.id}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Members</p>
                  {family.members.map((member: string) => (
                    <div key={member} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                          {member[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate">{member}</span>
                        {member === user.email && <ShieldCheck size={14} className="text-emerald-500" />}
                      </div>
                      {family.primaryUserId === user.uid && member !== user.email && (
                        <button 
                          onClick={() => removeMember(member)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {family.primaryUserId === user.uid && (
                  <div className="pt-4 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Member</p>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="Email address"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={addMember}
                        disabled={!newMemberEmail || loading}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all disabled:opacity-50"
                      >
                        <UserPlus size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
