import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Wallet, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Handle callback from Google OAuth
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userData = params.get('user');
        const authError = params.get('error');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(decodeURIComponent(userData));
                login(parsedUser, token);
                const destination = parsedUser.role === 'admin' ? '/admin/dashboard' : '/dashboard';
                navigate(destination);
            } catch (e) {
                setError('Failed to process login data');
            }
        } else if (authError) {
            setError('Google authentication failed. Please try again.');
        }
    }, [login, navigate]);

    const handleWalletLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed. Please install it to continue.');
            }

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const walletAddress = await signer.getAddress();

            // 1. Get nonce from server
            const nonceResponse = await fetch('/api/auth/wallet/nonce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });
            const { nonce } = await nonceResponse.json();

            // 2. Sign the message
            const message = `Sign this message to authenticate with SecureTransfer: ${nonce}`;
            const signature = await signer.signMessage(message);

            // 3. Verify with server
            const verifyResponse = await fetch('/api/auth/wallet/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, signature, role: selectedRole }),
            });

            if (!verifyResponse.ok) {
                const errData = await verifyResponse.json();
                throw new Error(errData.message || 'Authentication failed');
            }

            const data = await verifyResponse.json();
            login(data.user, data.accessToken);

            const destination = data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
            navigate(destination);
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'An unexpected error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to backend Google OAuth endpoint with selected role as state
        const backendUrl = '/api/auth/google';
        window.location.href = `${backendUrl}?role=${selectedRole}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                    <h1 className="text-4xl font-display font-bold gradient-text mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-dark-600 dark:text-dark-300">
                        Sign in to access your secure files
                    </p>
                </div>

                <div className="card-glass p-8">
                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3 text-red-600 dark:text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Role Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-3 text-dark-700 dark:text-dark-200">
                            Select Your Role
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {(['user', 'admin'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`py-2 px-4 rounded-lg font-semibold capitalize transition-all ${selectedRole === role
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'
                                        }`}
                                    disabled={isLoading}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Login Methods */}
                    <div className="space-y-4">
                        <button
                            onClick={handleWalletLogin}
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Wallet className="w-5 h-5" />
                            )}
                            <span>{isLoading ? 'Processing...' : 'Connect with MetaMask'}</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-dark-300 dark:border-dark-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-dark-800 text-dark-500">Or</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-dark-700 border-2 border-dark-300 dark:border-dark-600 hover:border-primary-500 dark:hover:border-primary-500 text-dark-700 dark:text-dark-200 font-semibold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
                        >
                            <Mail className="w-5 h-5" />
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-dark-600 dark:text-dark-400">
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-primary-600 hover:underline">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-primary-600 hover:underline">
                            Privacy Policy
                        </a>
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

declare global {
    interface Window {
        ethereum?: any;
    }
}

export default LoginPage;
