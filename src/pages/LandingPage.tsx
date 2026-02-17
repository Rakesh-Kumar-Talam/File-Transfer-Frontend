import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Cloud, Zap, Users, FileCheck } from 'lucide-react';

interface LandingPageProps {
    toggleDarkMode: () => void;
    darkMode: boolean;
}

const LandingPage = ({ toggleDarkMode, darkMode }: LandingPageProps) => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Lock className="w-8 h-8" />,
            title: 'End-to-End Encryption',
            description: 'AES-256-GCM encryption ensures your files are secure from upload to download.',
        },
        {
            icon: <Cloud className="w-8 h-8" />,
            title: 'Decentralized Storage',
            description: 'Files stored on IPFS for censorship resistance and redundancy.',
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: 'Blockchain Security',
            description: 'Smart contracts enforce access policies with immutable audit trails.',
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: 'Lightning Fast',
            description: 'Chunked uploads and parallel processing for optimal performance.',
        },
        {
            icon: <Users className="w-8 h-8" />,
            title: 'Role-Based Access',
            description: 'Granular control over who can send, receive, and manage files.',
        },
        {
            icon: <FileCheck className="w-8 h-8" />,
            title: 'Tamper-Proof',
            description: 'Cryptographic verification ensures file integrity at every step.',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-dark-200 dark:border-dark-700 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center space-x-2"
                        >
                            <Shield className="w-8 h-8 text-primary-600" />
                            <span className="text-2xl font-display font-bold gradient-text">SecureTransfer</span>
                        </motion.div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                            >
                                {darkMode ? '🌞' : '🌙'}
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-outline"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl md:text-7xl font-display font-bold mb-6"
                    >
                        <span className="gradient-text">Secure File Transfer</span>
                        <br />
                        <span className="text-dark-900 dark:text-dark-50">Powered by Blockchain</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-dark-600 dark:text-dark-300 mb-12 max-w-3xl mx-auto"
                    >
                        End-to-end encrypted file sharing with blockchain-enforced access control.
                        Your files, your rules, completely decentralized.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-primary text-lg px-8 py-4"
                        >
                            Start Sharing Securely
                        </button>
                        <button className="btn-outline text-lg px-8 py-4">
                            Learn More
                        </button>
                    </motion.div>

                    {/* Animated Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {[
                            { label: 'Files Secured', value: '10,000+' },
                            { label: 'Active Users', value: '2,500+' },
                            { label: 'Uptime', value: '99.9%' },
                        ].map((stat, index) => (
                            <div key={index} className="card-glass text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                                <div className="text-dark-600 dark:text-dark-400">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-white/50 dark:bg-dark-800/50">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                            <span className="gradient-text">Why Choose Us?</span>
                        </h2>
                        <p className="text-xl text-dark-600 dark:text-dark-300">
                            Built with cutting-edge technology for maximum security and privacy
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                className="card group cursor-pointer"
                            >
                                <div className="text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-dark-900 dark:text-dark-50">
                                    {feature.title}
                                </h3>
                                <p className="text-dark-600 dark:text-dark-300">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                            <span className="gradient-text">How It Works</span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: '1', title: 'Upload', description: 'Select and encrypt your file client-side' },
                            { step: '2', title: 'Configure', description: 'Set access policies and expiry' },
                            { step: '3', title: 'Share', description: 'Recipients receive secure access link' },
                            { step: '4', title: 'Download', description: 'Decrypt and download securely' },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-dark-900 dark:text-dark-50">
                                    {item.title}
                                </h3>
                                <p className="text-dark-600 dark:text-dark-300">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-secondary-600">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center text-white"
                >
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                        Ready to Secure Your Files?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of users who trust us with their sensitive data
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-white text-primary-600 hover:bg-dark-50 font-semibold py-4 px-8 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg"
                    >
                        Get Started Free
                    </button>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="bg-dark-900 text-dark-300 py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Shield className="w-6 h-6 text-primary-400" />
                        <span className="text-xl font-display font-bold text-white">SecureTransfer</span>
                    </div>
                    <p className="mb-4">
                        Decentralized, Secure, Private
                    </p>
                    <p className="text-sm text-dark-500">
                        © 2026 SecureTransfer. Built with ❤️ for privacy.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
