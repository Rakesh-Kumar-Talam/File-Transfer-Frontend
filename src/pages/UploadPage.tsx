import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import {
    Upload,
    X,
    File,
    Shield,
    Lock,
    Calendar,
    Users,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { processFileForUpload } from '../utils/crypto';

const UploadPage = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadTx, setUploadTx] = useState<string | null>(null);
    const [ipfsCID, setIpfsCID] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState(1);
    const [policy, setPolicy] = useState({
        expiryDays: 7,
        maxAccess: 5,
        receivers: '',
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStep(2);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false
    });

    const handleUpload = async () => {
        if (!file || !token) return;

        setIsUploading(true);
        try {
            // 1. Client-side encryption
            const { chunks, wrappedKey } = await processFileForUpload(file, (p) => {
                setProgress(p * 0.4); // Encryption is first 40%
            });

            // Prepare encrypted file for upload
            const encryptedBlob = new Blob(chunks.map(c => c.data), { type: 'application/octet-stream' });
            const ivs = chunks.map(c => c.iv);

            // 2. Register with Backend & Upload to IPFS
            setProgress(60);
            const formData = new FormData();
            formData.append('file', encryptedBlob, file.name + '.enc');
            formData.append('name', file.name);
            formData.append('size', file.size.toString());
            formData.append('type', file.type);
            formData.append('policy', JSON.stringify(policy));
            formData.append('wrappedKey', wrappedKey);
            formData.append('ivs', JSON.stringify(ivs));

            const response = await fetch('/api/files/register', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await response.json();
            setUploadTx(data.txHash);
            setIpfsCID(data.file.ipfsCID);
            setProgress(100);
            setStep(3);
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-dark-900 transition-colors duration-300 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Navigation / Progress */}
                <div className="flex items-center space-x-4 mb-12">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-dark-50">Upload New File</h1>
                </div>

                {/* Steps Card */}
                <div className="card-glass p-8 min-h-[500px] flex flex-col">
                    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                        {[
                            { id: 1, label: 'Select File', icon: <File className="w-5 h-5" /> },
                            { id: 2, label: 'Set Policy', icon: <Shield className="w-5 h-5" /> },
                            { id: 3, label: 'Complete', icon: <CheckCircle2 className="w-5 h-5" /> },
                        ].map((s) => (
                            <div key={s.id} className={`flex items-center space-x-2 shrink-0 ${step >= s.id ? 'text-primary-600' : 'text-dark-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s.id ? 'bg-primary-600/10' : 'bg-dark-100 dark:bg-dark-800'}`}>
                                    {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                                </div>
                                <span className="font-semibold">{s.label}</span>
                                {s.id < 3 && <div className="w-12 h-px bg-dark-200 dark:bg-dark-700 mx-4 hidden md:block"></div>}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col"
                            >
                                <div
                                    {...getRootProps()}
                                    className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer bg-dark-50/50 dark:bg-dark-800/30 ${isDragActive ? 'border-primary-500 scale-[0.99] bg-primary-50/30' : 'border-dark-300 dark:border-dark-700 hover:border-dark-400 dark:hover:border-dark-500'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mb-6">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-50 mb-2">
                                        Drag & drop your file here
                                    </h2>
                                    <p className="text-dark-500 text-center max-w-sm">
                                        Your file will be encrypted on your device before it ever leaves. No one, not even us, can see its content.
                                    </p>
                                    <button className="mt-8 btn-primary">Browse Files</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && file && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 space-y-8"
                            >
                                <div className="flex items-center space-x-4 p-4 rounded-xl bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700">
                                    <div className="p-3 bg-white dark:bg-dark-700 rounded-lg shadow-sm">
                                        <File className="w-8 h-8 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-lg text-dark-900 dark:text-dark-50">{file.name}</div>
                                        <div className="text-sm text-dark-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                    <button onClick={() => setStep(1)} className="p-2 hover:bg-dark-200 dark:hover:bg-dark-700 rounded-lg transition-colors">
                                        <X className="w-5 h-5 text-dark-500" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="flex items-center space-x-2 text-sm font-bold text-dark-700 dark:text-dark-200">
                                            <Calendar className="w-4 h-4" />
                                            <span>Access Expiry (Days)</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={policy.expiryDays}
                                            onChange={(e) => setPolicy({ ...policy, expiryDays: parseInt(e.target.value) })}
                                            className="input-field"
                                            placeholder="7"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="flex items-center space-x-2 text-sm font-bold text-dark-700 dark:text-dark-200">
                                            <Users className="w-4 h-4" />
                                            <span>Max Downloads</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={policy.maxAccess}
                                            onChange={(e) => setPolicy({ ...policy, maxAccess: parseInt(e.target.value) })}
                                            className="input-field"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center space-x-2 text-sm font-bold text-dark-700 dark:text-dark-200">
                                        <Lock className="w-4 h-4" />
                                        <span>Authorized Receivers (Addresses/Emails)</span>
                                    </label>
                                    <textarea
                                        value={policy.receivers}
                                        onChange={(e) => setPolicy({ ...policy, receivers: e.target.value })}
                                        className="input-field min-h-[100px] resize-none"
                                        placeholder="Enter wallet addresses or emails, separated by commas..."
                                    />
                                    <p className="text-xs text-dark-500 flex items-center space-x-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Each receiver will have their own unique decryption key wrap.</span>
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-dark-200 dark:border-dark-700 space-y-6">
                                    {isUploading ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-primary-600">Encrypting & Uploading...</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-dark-100 dark:bg-dark-800 rounded-full overflow-hidden border border-dark-200 dark:border-dark-700">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-center space-x-2 text-sm text-dark-500">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Breaking into encrypted chunks...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleUpload}
                                            className="w-full py-4 btn-primary text-lg flex items-center justify-center space-x-3"
                                        >
                                            <Shield className="w-6 h-6" />
                                            <span>Encrypt & Send Securely</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
                            >
                                <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-display font-bold text-dark-900 dark:text-dark-50 mb-2">Upload Complete!</h2>
                                    <p className="text-dark-500 max-w-sm">
                                        Your file is now securely stored and access policies are on-chain via smart contracts.
                                    </p>
                                </div>

                                <div className="w-full max-w-sm p-4 rounded-xl bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 space-y-2">
                                    <div className="font-mono text-xs break-all text-dark-500">IPFS: ipfs://{ipfsCID}</div>
                                    <div className="font-mono text-xs break-all text-primary-500">TX: {uploadTx?.substring(0, 40)}...</div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8">
                                    <button onClick={() => navigate('/dashboard')} className="btn-outline">Go to Dashboard</button>
                                    <button onClick={() => setStep(1)} className="btn-primary">Upload Another</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Security Note */}
                <div className="mt-8 flex items-start space-x-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                    <Shield className="w-5 h-5 mt-0.5 shrink-0" />
                    <p className="text-sm">
                        <strong>Security Note:</strong> We use AES-256-GCM for encryption. Keys are never sent to our servers in plaintext. Access is authenticated via MetaMask signatures or Google OAuth tokens verified against on-chain policies.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
