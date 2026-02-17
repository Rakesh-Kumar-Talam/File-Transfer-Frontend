import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Files,
    ArrowDownCircle,
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingUp,
    Activity,
    RefreshCw
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import { API_URL } from '../config';


interface Stats {
    totalUsers: number;
    totalAdmins: number;
    totalFiles: number;
    totalDownloads: number;
    activeFiles: number;
    revokedFiles: number;
    failedLogins24h: number;
}

const AdminDashboard: React.FC<{ toggleDarkMode: () => void; darkMode: boolean }> = ({ toggleDarkMode, darkMode }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [systemLoad, setSystemLoad] = useState(4);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const [statsRes, logsRes] = await Promise.all([
                fetch(`${API_URL}/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/admin/audit-logs?limit=5`, { headers: { 'Authorization': `Bearer ${token}` } })

            ]);

            const statsData = await statsRes.json();
            const logsData = await logsRes.json();

            if (statsData.success) setStats(statsData.stats);
            if (logsData.success) setLogs(logsData.logs);

            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling every 10s

        // Simulate load fluctuation
        const loadInterval = setInterval(() => {
            setSystemLoad(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                return Math.max(2, Math.min(12, prev + change));
            });
        }, 3000);

        return () => {
            clearInterval(interval);
            clearInterval(loadInterval);
        };
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users />, color: 'blue' },
        { label: 'Total Files', value: stats?.totalFiles || 0, icon: <Files />, color: 'indigo' },
        { label: 'Downloads', value: stats?.totalDownloads || 0, icon: <ArrowDownCircle />, color: 'emerald' },
        { label: 'Active Files', value: stats?.activeFiles || 0, icon: <CheckCircle />, color: 'green' },
        { label: 'Revoked', value: stats?.revokedFiles || 0, icon: <XCircle />, color: 'rose' },
        { label: 'Failed Logins (24h)', value: stats?.failedLogins24h || 0, icon: <AlertTriangle />, color: 'amber' },
    ];

    if (loading) {
        return (
            <AdminLayout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
            <div className="space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            System Overview
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live monitoring active • Last update: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </motion.div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Sync Data
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statCards.map((stat, index) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={stat.label}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group"
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                                    {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 24 })}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform opacity-50`} />
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* System Health */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Activity size={18} className="text-blue-500" />
                                Infrastructure
                            </h3>
                            <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-black uppercase tracking-widest shadow-sm">Active</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'MongoDB Database', status: 'Optimal', color: 'green' },
                                { name: 'IPFS Network', status: 'Stable', color: 'blue' },
                                { name: 'Polygon RPC', status: 'Syncing', color: 'indigo' },
                                { name: 'Audit Engine', status: 'Secure', color: 'green' }
                            ].map(item => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">{item.name}</span>
                                    <span className={`text-xs font-bold text-${item.color}-500 flex items-center gap-2`}>
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500 animate-pulse`} />
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">System Load</span>
                                    <span className={`text-[10px] font-bold font-mono ${systemLoad > 8 ? 'text-amber-500' : 'text-blue-500'}`}>{systemLoad}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: `${systemLoad}%` }}
                                        transition={{ duration: 1 }}
                                        className={`h-full ${systemLoad > 8 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Activity Feed */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Activity size={18} className="text-amber-500" />
                                Real-time Activity
                            </h3>
                            <button className="text-xs font-bold text-blue-600 hover:underline">View All Logs</button>
                        </div>
                        <div className="space-y-4">
                            {logs.map((log, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={log._id || idx}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                        }`}>
                                        <TrendingUp size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">
                                                {log.actionType === 'FILE_UPLOAD' ? (
                                                    <span className="flex items-center gap-1">
                                                        Sent: <span className="text-blue-500">{log.metadata?.name}</span>
                                                    </span>
                                                ) : log.actionType === 'FILE_ACCESS_REQUEST' ? (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        Accessed: <span className="text-emerald-500">{log.metadata?.fileName}</span>
                                                    </span>
                                                ) : (
                                                    log.actionType.replace(/_/g, ' ')
                                                )}
                                            </p>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate font-mono">
                                            {log.actionType === 'FILE_UPLOAD' ? (
                                                <>
                                                    {log.actorId.substring(0, 6)}... → {log.metadata?.receivers?.length || 0} receiver(s)
                                                </>
                                            ) : log.actionType === 'FILE_ACCESS_REQUEST' ? (
                                                <>
                                                    {log.metadata?.receiverAddress?.substring(0, 8)}... accessed from {log.metadata?.senderId?.substring(0, 8)}...
                                                </>
                                            ) : (
                                                `${log.actorRole} • target: ${log.targetType}`
                                            )}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            {logs.length === 0 && (
                                <div className="py-8 text-center text-slate-400 text-sm italic">
                                    Waiting for system events...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
