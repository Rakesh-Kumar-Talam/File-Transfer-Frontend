import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Upload,
    FileText,
    Shield,
    Clock,
    Users,
    LogOut,
    Settings,
    Activity,
    ArrowRight,
    Search,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardPageProps {
    toggleDarkMode: () => void;
    darkMode: boolean;
}

const DashboardPage = ({ toggleDarkMode, darkMode }: DashboardPageProps) => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFiles = async () => {
            if (!token) return;
            try {
                const response = await fetch('/api/files/my-files', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setFiles(data.files);
                }
            } catch (err) {
                console.error('Failed to fetch files:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFiles();
    }, [token]);

    const stats = [
        { label: 'Total Files', value: files.length.toString(), icon: <Upload className="w-5 h-5" /> },
        { label: 'Sent', value: files.filter(f => f.type === 'sent').length.toString(), icon: <Users className="w-5 h-5" /> },
        { label: 'Received', value: files.filter(f => f.type === 'received').length.toString(), icon: <Activity className="w-5 h-5" /> },
    ];

    return (
        <div className="flex h-screen bg-white dark:bg-dark-900 transition-colors duration-300 overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-64 border-r border-dark-200 dark:border-dark-700 bg-dark-50/50 dark:bg-dark-800/50 backdrop-blur-md hidden md:flex flex-col"
            >
                <div className="p-6 flex items-center space-x-2">
                    <Shield className="w-8 h-8 text-primary-600" />
                    <span className="text-xl font-display font-bold gradient-text">SecureTransfer</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button onClick={() => navigate('/dashboard')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-primary-600 text-white shadow-md">
                        <Activity className="w-5 h-5" />
                        <span className="font-semibold">Dashboard</span>
                    </button>
                    <button onClick={() => navigate('/files')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors">
                        <FileText className="w-5 h-5" />
                        <span className="font-semibold">My Files</span>
                    </button>
                    {(user?.role === 'sender' || user?.role === 'user') && (
                        <button onClick={() => navigate('/upload')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors">
                            <Upload className="w-5 h-5" />
                            <span className="font-semibold">New Upload</span>
                        </button>
                    )}
                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors">
                        <Settings className="w-5 h-5" />
                        <span className="font-semibold">Settings</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-dark-200 dark:border-dark-700">
                    <button onClick={() => logout()} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-semibold">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg border-b border-dark-200 dark:border-dark-700 px-8 h-16 flex items-center justify-between">
                    <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-dark-50">
                        Welcome back, <span className="text-primary-600">{user?.role}</span>
                    </h1>

                    <div className="flex items-center space-x-4">
                        <div className="relative hidden lg:block">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                className="pl-10 pr-4 py-2 rounded-full bg-dark-100 dark:bg-dark-800 border-none focus:ring-2 focus:ring-primary-500 transition-all text-sm w-64"
                            />
                        </div>
                        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800">
                            {darkMode ? '🌞' : '🌙'}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                            {user?.role === 'admin' ? 'A' : (user?.walletAddress ? 'W' : 'G')}
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="card-glass p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
                                        {stat.icon}
                                    </div>
                                    <span className="text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">+Verified</span>
                                </div>
                                <div className="text-3xl font-display font-bold text-dark-900 dark:text-dark-50">{stat.value}</div>
                                <div className="text-dark-500 font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Files */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="card p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-bold text-dark-900 dark:text-dark-50">Recent Files</h2>
                                <button
                                    onClick={() => navigate('/files')}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center space-x-1"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                                    </div>
                                ) : files.length === 0 ? (
                                    <div className="text-center py-12 text-dark-500">No files found. Try uploading one!</div>
                                ) : (
                                    files.slice(0, 5).map((file) => (
                                        <div key={file.fileId} className="flex items-center justify-between p-4 rounded-xl border border-dark-100 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors group cursor-pointer">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-3 bg-dark-100 dark:bg-dark-700 rounded-lg text-dark-600 dark:text-dark-400 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-dark-900 dark:text-dark-50">{file.name}</div>
                                                    <div className="text-sm text-dark-500">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.expiry}</div>
                                                </div>
                                            </div>
                                            <span className={`status-badge status-${file.status === 'active' ? 'encrypted' : 'expired'}`}>
                                                {file.status === 'active' ? 'Protected' : 'Revoked'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>

                        {/* Quick Actions / Integration */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="card bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-8 relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-display font-bold mb-2">Need to share a file?</h2>
                                    <p className="opacity-90 mb-6">Upload securely and control access with smart contract policies.</p>
                                    <button
                                        onClick={() => navigate('/upload')}
                                        className="bg-white text-primary-600 hover:bg-dark-50 px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                                    >
                                        Start New Upload
                                    </button>
                                </div>
                                <Upload className="w-32 h-32 absolute -right-8 -bottom-8 opacity-20 transform -rotate-12" />
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="card-glass border-primary-500/30 p-6 flex items-center space-x-4"
                            >
                                <div className="p-3 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl text-secondary-600">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-dark-900 dark:text-dark-50">Wallet Verified</h3>
                                    <p className="text-sm text-dark-500">Your transactions are secured by Polygon network.</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="card-glass border-blue-500/30 p-6 flex items-center space-x-4"
                            >
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-dark-900 dark:text-dark-50">Access History</h3>
                                    <p className="text-sm text-dark-500">View real-time audit logs of your shared files.</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
