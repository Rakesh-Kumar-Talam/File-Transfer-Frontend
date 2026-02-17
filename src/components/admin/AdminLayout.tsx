import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    FileText,
    ShieldAlert,
    LogOut,
    Moon,
    Sun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
    children: React.ReactNode;
    toggleDarkMode: () => void;
    darkMode: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, toggleDarkMode, darkMode }) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const menuItems = [
        { name: 'Overview', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Files', path: '/admin/files', icon: <FileText size={20} /> },
        { name: 'Audit Logs', path: '/admin/logs', icon: <ShieldAlert size={20} /> },
    ];

    return (
        <div className={`flex h-screen ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shadow-xl z-10 transition-colors duration-300">
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
                            S
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin Hub</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span className="font-medium text-sm">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        <span className="font-medium text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
                    >
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-10">
                    <h1 className="text-lg font-semibold capitalize flex items-center gap-2">
                        <span className="text-slate-400">Panel /</span>
                        <span>{location.pathname.split('/').pop()?.replace('-', ' ')}</span>
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">System Administrator</span>
                            <span className="text-[10px] text-slate-500 opacity-70 uppercase tracking-widest font-mono">
                                ID: {user?.userId?.substring(0, 8)}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white ring-4 ring-blue-500/10 shadow-lg">
                            {user?.role?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={location.pathname}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
