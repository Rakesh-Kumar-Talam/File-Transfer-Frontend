import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Search,
    Terminal,
    User,
    Fingerprint,
    Globe,
    Cpu,
    ArrowRight,
    Filter,
    Clock
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';

interface AuditLog {
    _id: string;
    actorId: string;
    actorRole: string;
    actorType: string;
    actionType: string;
    targetType: string;
    targetId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    status: string;
    createdAt: string;
}

const AdminAuditLogs: React.FC<{ toggleDarkMode: () => void; darkMode: boolean }> = ({ toggleDarkMode, darkMode }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const [search, setSearch] = useState('');

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('authToken');
            let url = '/api/admin/audit-logs?limit=100';
            if (filter) url += `&type=${filter}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const filteredLogs = logs.filter(log =>
        log.actionType.toLowerCase().includes(search.toLowerCase()) ||
        log.actorId.toLowerCase().includes(search.toLowerCase()) ||
        (log.targetId && log.targetId.toLowerCase().includes(search.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        return status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
    };

    const getActionColor = (action: string) => {
        if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        if (action.includes('FILE')) return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
        if (action.includes('FREEZE') || action.includes('REVOKE')) return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    };

    return (
        <AdminLayout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold dark:text-white">Audit Trails</h2>
                        <p className="text-slate-500 dark:text-slate-400">Immutable record of all system and administrative actions.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchLogs}
                            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <Clock size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none md:w-64"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="auth">Authentication</option>
                            <option value="file">Files</option>
                            <option value="user">User Ops</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </header>

                <div className="space-y-4">
                    {filteredLogs.map((log) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={log._id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="p-5 flex flex-col md:flex-row gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${getActionColor(log.actionType)}`}>
                                        <Terminal size={20} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center flex-wrap gap-2 mb-1">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(log.status)}`}>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 dark:text-slate-200">{log.actionType.replace(/_/g, ' ')}</span>
                                            <ArrowRight size={14} className="text-slate-300" />
                                            <span className="text-sm font-medium text-slate-500 truncate">{log.targetType}: {log.targetId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col justify-between items-end gap-2 text-right">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
                                            <User size={12} className="text-slate-400" />
                                            {log.actorRole.toUpperCase()} • ID: {log.actorId.substring(0, 8)}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Log Details - Metadata */}
                            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-2">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <Globe size={12} />
                                        <span className="font-mono">IP: {log.ipAddress || 'Internal'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 max-w-xs truncate">
                                        <Cpu size={12} />
                                        <span className="truncate">{log.userAgent || 'Unknown System'}</span>
                                    </div>
                                    {log.metadata && (
                                        <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold cursor-help" title={JSON.stringify(log.metadata, null, 2)}>
                                            <Fingerprint size={12} />
                                            <span>Full Hash: {log._id.substring(0, 8)}...</span>
                                        </div>
                                    )}
                                </div>

                                {log.metadata && (
                                    <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/50">
                                        {log.metadata.name && (
                                            <div className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                                                File: <strong>{log.metadata.name}</strong>
                                            </div>
                                        )}
                                        {log.metadata.receivers && (
                                            <div className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded flex items-center gap-1">
                                                To: <strong>{log.metadata.receivers.length} Users</strong>
                                                <span className="opacity-60 font-mono">({log.metadata.receivers.slice(0, 2).map((r: string) => r.substring(0, 4)).join(', ')}...)</span>
                                            </div>
                                        )}
                                        {log.metadata.receiverAddress && (
                                            <div className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-1 rounded">
                                                Receiver: <strong>{log.metadata.receiverAddress.substring(0, 8)}...</strong>
                                            </div>
                                        )}
                                        {log.metadata.txHash && (
                                            <div className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-1 rounded font-mono truncate max-w-[150px]">
                                                TX: {log.metadata.txHash}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {loading && (
                        <div className="py-12 flex justify-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    )}

                    {!loading && filteredLogs.length === 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dotted border-slate-300 dark:border-slate-800 p-12 text-center text-slate-400">
                            No audit records matched your criteria.
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAuditLogs;
