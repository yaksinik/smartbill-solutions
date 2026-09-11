import React from 'react';
import { useTheme, useUser } from '../App';
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Smartphone, 
  LogOut, 
  ChevronRight, 
  Globe, 
  Eye,
  Trash2
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';

const SettingItem = ({ icon: Icon, label, description, action, danger }: { icon: any; label: string; description: string; action?: React.ReactNode; danger?: boolean }) => (
  <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${danger ? 'bg-red-50 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className={`font-bold text-lg ${danger ? 'text-red-500' : ''}`}>{label}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
    {action || <ChevronRight size={20} className="text-slate-400" />}
  </div>
);

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account preferences and security.</p>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-2">Appearance</h2>
          <SettingItem 
            icon={theme === 'dark' ? Moon : Sun} 
            label="Dark Mode" 
            description="Switch between light and dark themes."
            action={
              <button 
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            }
          />
        </div>

        {/* Notifications Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-2">Notifications</h2>
          <SettingItem 
            icon={Bell} 
            label="Push Notifications" 
            description="Get notified about upcoming bills and payments."
            action={
              <button className="w-14 h-8 rounded-full bg-emerald-500 relative">
                <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow-md" />
              </button>
            }
          />
          <SettingItem 
            icon={Smartphone} 
            label="SMS Alerts" 
            description="Receive payment confirmations via SMS."
            action={
              <button className="w-14 h-8 rounded-full bg-slate-200 relative">
                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md" />
              </button>
            }
          />
        </div>

        {/* Security Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-2">Security & Privacy</h2>
          <SettingItem 
            icon={Shield} 
            label="Two-Factor Authentication" 
            description="Add an extra layer of security to your account."
            action={
              <button className="w-14 h-8 rounded-full bg-slate-200 dark:bg-slate-800 relative">
                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md" />
              </button>
            }
          />
          <SettingItem 
            icon={Eye} 
            label="Privacy Settings" 
            description="Control who can see your family billing activity."
            action={
              <button className="w-14 h-8 rounded-full bg-emerald-500 relative">
                <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow-md" />
              </button>
            }
          />
        </div>

        {/* Account Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-2">Account</h2>
          <button onClick={handleLogout} className="w-full text-left">
            <SettingItem 
              icon={LogOut} 
              label="Logout" 
              description="Sign out of your account on this device."
              danger
            />
          </button>
          <SettingItem 
            icon={Trash2} 
            label="Delete Account" 
            description="Permanently remove your account and all data."
            danger
          />
        </div>
      </div>

      <div className="text-center py-8">
        <p className="text-slate-400 text-sm">SmartBill v1.0.0 • Made with ❤️ for families</p>
      </div>
    </div>
  );
}
