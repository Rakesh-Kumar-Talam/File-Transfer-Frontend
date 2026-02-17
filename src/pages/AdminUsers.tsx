import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    ShieldCheck,
    Clock,
    Lock,
    Unlock,
    Mail,
    Wallet
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import { API_URL } from '../config';


interface User {
    userId: string;
    walletAddress?: string;
    emailHash?: string;
    role: string;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
}

const AdminUsers: React.FC<{ toggleDarkMode: () => void; darkMode: boolean }> = ({ toggleDarkMode, darkMode }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/admin/users`, {

                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleFreeze = async (userId: string, currentStatus: string) => {
        const shouldFreeze = currentStatus !== 'frozen';
        if (!window.confirm(`Are you sure you want to ${shouldFreeze ? 'FREEZE' : 'ACTIVATE'} this user?`)) return;

        setActionLoading(userId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/admin/users/${userId}/toggle-freeze`, {

                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ freeze: shouldFreeze })
            });
            const data = await response.json();
            if (data.success) {
                setUsers(users.map(u => u.userId === userId ? { ...u, status: shouldFreeze ? 'frozen' : 'active' } : u));
            }
        } catch (err) {
            console.error('Failed to toggle status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.walletAddress || u.emailHash || '').toLowerCase().includes(search.toLowerCase()) ||
            u.userId.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <AdminLayout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold dark:text-white">User Management</h2>
                        <p className="text-slate-500 dark:text-slate-400">Manage system users and their access status.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchUsers}
                            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            title="Sync Users"
                        >
                            <Clock size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="bg-blue-600/10 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                            <Users size={16} />
                            {filteredUsers.length} Users
                        </div>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by wallet, email or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full md:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="admin">Admins</option>
                        <option value="sender">Senders</option>
                        <option value="receiver">Receivers</option>
                    </select>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">User Identity</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">Role</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">Status</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">Last Activity</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredUsers.map((user) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={user.userId}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    {user.walletAddress ? <Wallet size={16} /> : <Mail size={16} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-mono truncate max-w-[180px] text-slate-900 dark:text-slate-200">
                                                        {user.walletAddress || user.emailHash}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">ID: {user.userId.substring(0, 12)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'frozen' ? 'text-rose-500' : 'text-emerald-500'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'frozen' ? 'bg-rose-500' : 'bg-emerald-500'} ${user.status !== 'frozen' ? 'animate-pulse' : ''}`} />
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-xs"><Clock size={10} /> {new Date(user.lastLoginAt || user.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] opacity-70">{new Date(user.lastLoginAt || user.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleToggleFreeze(user.userId, user.status)}
                                                    disabled={actionLoading === user.userId || user.role === 'admin'}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${user.status === 'frozen'
                                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                                                        : 'bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white'
                                                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                                                >
                                                    {actionLoading === user.userId ? (
                                                        <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                                    ) : user.status === 'frozen' ? (
                                                        <><Unlock size={14} /> Unfreeze</>
                                                    ) : (
                                                        <><Lock size={14} /> Freeze Account</>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filteredUsers.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users size={40} className="opacity-20" />
                                                <p>No matching users found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
