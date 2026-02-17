import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Download,
    Trash2,
    Share2,
    Clock,
    Shield,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    MoreVertical,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FilesPage = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
    const [search, setSearch] = useState('');
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFiles = async () => {
        if (!token) return;
        setIsLoading(true);
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

    useEffect(() => {
        fetchFiles();
    }, [token]);

    const filteredFiles = files.filter(f => {
        const matchesFilter = filter === 'all' || f.type === filter;
        const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleDownload = async (file: any) => {
        // file object now only contains metadata, no keys.

        const toastId = `download-${file.fileId}`;
        setIsLoading(true);

        try {
            console.log(`Requesting access for ${file.name}...`);

            // 1. Request Access (Fetch Key & Token)
            const accessResponse = await fetch(`/api/files/${file.fileId}/access`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!accessResponse.ok) {
                const errorData = await accessResponse.json();
                throw new Error(errorData.message || 'Access denied');
            }

            const accessData = await accessResponse.json();
            const { wrappedKey, ivs, ipfsCID } = accessData;

            if (!wrappedKey) throw new Error('No decryption key returned from server.');

            console.log(`Downloading encrypted blob from IPFS...`);

            // 2. Fetch encrypted blob from IPFS (via backend proxy to avoid CORS)
            const ipfsUrl = `/api/files/ipfs/${ipfsCID}`;
            const response = await fetch(ipfsUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to fetch file from IPFS proxy');
            }
            const encryptedBlob = await response.blob();

            // 3. Decrypt
            const { reconstructFile } = await import('../utils/crypto');
            console.log('Decrypting...');
            const decryptedBlob = await reconstructFile(
                encryptedBlob,
                wrappedKey,
                ivs,
                (p) => console.log(`Decryption progress: ${p}%`)
            );

            // 4. Trigger Download
            console.log(`✅ Decrypted Blob Size: ${decryptedBlob.size} bytes`);

            if (decryptedBlob.size === 0) {
                alert('Decryption resulted in an empty file. Please check the integrity of the upload.');
                return;
            }

            const url = window.URL.createObjectURL(decryptedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace(/\.enc$/i, '');
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            // Note: Access log is now handled by the /access endpoint on backend

        } catch (error: any) {
            console.error('Download failed:', error);
            alert(`Download/Decryption failed: ${error.message}`);
        } finally {
            setIsLoading(false);
            // Refresh file list to update access counts
            fetchFiles();
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-dark-900 transition-colors duration-300 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-dark-50">My Files</h1>
                        <p className="text-dark-500">Manage your secure transfers and access history.</p>
                    </div>
                    <button
                        onClick={() => navigate('/upload')}
                        className="btn-primary flex items-center space-x-2 w-fit"
                    >
                        <Share2 className="w-5 h-5" />
                        <span>New Transfer</span>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="card-glass p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center space-x-2 bg-dark-100 dark:bg-dark-800 p-1 rounded-xl w-full md:w-auto">
                        {(['all', 'sent', 'received'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-semibold capitalize transition-all ${filter === t
                                    ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm'
                                    : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-100 dark:bg-dark-800 border-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                        <button className="p-2 rounded-xl bg-dark-100 dark:bg-dark-800 text-dark-500 hover:text-primary-600">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
                            <p className="text-dark-500 font-medium font-display">Retrieving your secure files...</p>
                        </div>
                    ) : (
                        filteredFiles.map((file, index) => (
                            <motion.div
                                key={file.fileId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="card group hover:scale-[1.02]"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${file.type === 'sent'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                                        }`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`status-badge status-${file.status === 'active' ? 'encrypted' : 'expired'}`}>
                                            {file.status === 'active' ? 'Protected' : 'Revoked'}
                                        </span>
                                        <button className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-dark-900 dark:text-dark-50 mb-1 truncate">
                                    {file.name}
                                </h3>
                                <div className="text-sm text-dark-500 mb-6 flex items-center space-x-2">
                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span className="capitalize">{file.type}</span>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-dark-100 dark:border-dark-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-2 text-dark-600 dark:text-dark-400">
                                            <Clock className="w-4 h-4" />
                                            <span>Expires: {file.expiry}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-dark-600 dark:text-dark-400">
                                            <Download className="w-4 h-4" />
                                            <span>{file.downloads}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        {file.status === 'active' ? (
                                            <>
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    className="flex-1 btn-primary py-2 text-sm flex items-center justify-center space-x-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span>Download</span>
                                                </button>
                                                <button className="p-2 rounded-lg border-2 border-dark-200 dark:border-dark-700 text-dark-500 hover:text-primary-600 hover:border-primary-600 transition-all">
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <button className="w-full bg-dark-100 dark:bg-dark-800 text-dark-500 py-2 rounded-lg text-sm font-semibold cursor-not-allowed">
                                                Access Revoked
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* CID Footer */}
                                <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700 flex items-center justify-between">
                                    <div className="flex items-center space-x-1 text-[10px] font-mono text-dark-400">
                                        <Shield className="w-3 h-3" />
                                        <span>CID: {file.cid}</span>
                                    </div>
                                    <a
                                        href={`https://gateway.pinata.cloud/ipfs/${file.cid}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-dark-400 hover:text-primary-600"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {!isLoading && filteredFiles.length === 0 && (
                    <div className="text-center py-20 px-4">
                        <div className="w-20 h-20 bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6 text-dark-400">
                            <FileText className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-50 mb-2">No files found</h2>
                        <p className="text-dark-500 mb-8 max-w-sm mx-auto">
                            We couldn't find any files matching your search or filters. Try adjusting them.
                        </p>
                        <button
                            onClick={() => { setSearch(''); setFilter('all'); }}
                            className="btn-outline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilesPage;
