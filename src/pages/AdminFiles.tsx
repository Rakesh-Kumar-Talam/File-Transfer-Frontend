import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    File,
    User,
    Calendar,
    ShieldX,
    Filter,
    Settings2,
    Clock,
    Search,
    Download
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import { API_URL } from '../config';


interface FileRecord {
    fileId: string;
    name: string;
    size: number;
    type: string;
    status: string;
    sender: string;
    senderAddress: string;
    policy: {
        expiryTimestamp: number;
        maxAccess: number;
        usedAccess: number;
    };
    wrappedKeys: { receiverAddress: string; key: string }[];
    createdAt: string;
}

const AdminFiles: React.FC<{ toggleDarkMode: () => void; darkMode: boolean }> = ({ toggleDarkMode, darkMode }) => {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Edit Form State
    const [editMaxAccess, setEditMaxAccess] = useState(0);
    const [editExpiryDays, setEditExpiryDays] = useState(7);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/admin/files`, {

                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                console.log('Admin Page: Successfully fetched files:', data.files);
                setFiles(data.files);
            }
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const filteredFiles = files.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.fileId.toLowerCase().includes(search.toLowerCase()) ||
            (f.senderAddress || '').toLowerCase().includes(search.toLowerCase()) ||
            f.wrappedKeys?.some(k => k.receiverAddress.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openEditModal = (file: FileRecord) => {
        setSelectedFile(file);
        setEditMaxAccess(file.policy.maxAccess);
        setIsEditModalOpen(true);
    };

    const handleUpdatePolicy = async () => {
        if (!selectedFile) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/admin/files/${selectedFile.fileId}/policy`, {

                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    maxAccess: editMaxAccess,
                    expiryDays: editExpiryDays
                })
            });
            const data = await response.json();
            if (data.success) {
                setIsEditModalOpen(false);
                fetchFiles();
            }
        } catch (err) {
            console.error('Update failed:', err);
        }
    };

    const handleRevoke = async (fileId: string) => {
        if (!window.confirm('EMERGENCY REVOCATION: This action will PERMANENTLY revoke this file for ALL users.')) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/admin/files/${fileId}/revoke`, {

                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setFiles(files.map(f => f.fileId === fileId ? { ...f, status: 'revoked' } : f));
            }
        } catch (err) {
            console.error('Revocation failed:', err);
        }
    };

    const handleAuditDownload = async (file: FileRecord) => {
        if (!window.confirm(`AUDIT ACCESS: As an administrator, you are requesting access to download and decrypt "${file.name}". This action will be logged.`)) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');

            // 1. Get superuser access token and keys
            const accessRes = await fetch(`${API_URL}/admin/files/${file.fileId}/audit-access`, {

                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!accessRes.ok) throw new Error('Audit access denied');
            const { downloadToken, ipfsCID, wrappedKeys, ivs } = await accessRes.json();

            // Use the first available wrapped key (or sender key)
            const keyToUse = wrappedKeys[0]?.key;
            if (!keyToUse) throw new Error('No decryption keys available for this file.');

            // 2. Fetch encrypted blob
            const ipfsUrl = `${API_URL}/files/ipfs/${ipfsCID}`;

            const response = await fetch(ipfsUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch from IPFS proxy');
            const encryptedBlob = await response.blob();

            // 3. Decrypt
            const { reconstructFile } = await import('../utils/crypto');
            const decryptedBlob = await reconstructFile(
                encryptedBlob,
                keyToUse,
                ivs,
                (p) => console.log(`Audit Decryption: ${Math.round(p)}%`)
            );

            // 4. Trigger Download
            const url = window.URL.createObjectURL(decryptedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AUDIT_${file.name}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            alert('Audit download complete. Please handle this data securely according to compliance policy.');
        } catch (err: any) {
            console.error('Audit download failed:', err);
            alert(`Audit failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold dark:text-white">File Monitoring</h2>
                        <p className="text-slate-500 dark:text-slate-400">Track and manage global file access policies.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchFiles}
                            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <Clock size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </header>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by file name, ID, sender or receiver address..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Every Status</option>
                        <option value="active">Active Only</option>
                        <option value="revoked">Revoked Only</option>
                    </select>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">File Info</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">Transfer Flow</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">Access Status</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold">Timeline</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500 font-bold text-center">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredFiles.map((file) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={file.fileId}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                                    <File size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate max-w-[150px]">{file.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB • {file.fileId.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-black text-blue-500 w-8">From</span>
                                                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                                                        {file.senderAddress || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-black text-emerald-500 w-8">To</span>
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {file.wrappedKeys?.map((k, i) => (
                                                            <span key={i} className="text-[9px] font-mono bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded" title={k.receiverAddress}>
                                                                {k.receiverAddress.substring(0, 6)}...{k.receiverAddress.substring(38)}
                                                            </span>
                                                        ))}
                                                        {(!file.wrappedKeys || file.wrappedKeys.length === 0) && (
                                                            <span className="text-[9px] italic text-slate-400">Public/No specific receivers</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 w-32">
                                                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                                    <span className={`${file.status === 'revoked' ? 'text-rose-500' : 'text-emerald-500 uppercase tracking-tighter'}`}>
                                                        {file.status}
                                                    </span>
                                                    <span className="text-slate-500 font-mono">{file.policy.usedAccess}/{file.policy.maxAccess}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (file.policy.usedAccess / file.policy.maxAccess) * 100)}%` }}
                                                        className={`h-full ${file.status === 'revoked' ? 'bg-rose-500' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] text-slate-500 space-y-1">
                                                <p className="flex items-center gap-1"><Calendar size={10} /> {new Date(file.createdAt).toLocaleDateString()}</p>
                                                <p className={`font-bold flex items-center gap-1 ${Date.now() > file.policy.expiryTimestamp ? 'text-rose-400' : 'text-amber-500'}`}>
                                                    <Clock size={10} /> {new Date(file.policy.expiryTimestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleAuditDownload(file)}
                                                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    title="Audit Download"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(file)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Adjust Settings"
                                                >
                                                    <Settings2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleRevoke(file.fileId)}
                                                    disabled={file.status === 'revoked'}
                                                    className={`p-2 rounded-lg transition-colors ${file.status === 'revoked'
                                                        ? 'text-slate-300 bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-none'
                                                        : 'text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-500/20'
                                                        }`}
                                                    title="Emergency Revoke"
                                                >
                                                    <ShieldX size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!loading && filteredFiles.length === 0 && (
                        <div className="p-8 text-center text-slate-400">No matching files found.</div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8"
                    >
                        <h3 className="text-xl font-bold mb-2">Adjust Access Policy</h3>
                        <p className="text-slate-500 text-sm mb-6">Modify download limits and expiry for <span className="text-blue-500 font-bold">{selectedFile?.name}</span></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Maximum Downloads</label>
                                <input
                                    type="number"
                                    value={editMaxAccess}
                                    onChange={(e) => setEditMaxAccess(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 font-bold text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Extend Expiry (Days from now)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 7, 30, 90].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setEditExpiryDays(days)}
                                            className={`py-2 rounded-lg text-xs font-bold transition-colors ${editExpiryDays === days
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                                }`}
                                        >
                                            {days}d
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePolicy}
                                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Apply Policy
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminFiles;
