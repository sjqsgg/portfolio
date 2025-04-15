import { motion } from 'framer-motion';

export default function Blog1() {
  return (
    <motion.div
      className="max-w-3xl mx-auto px-6 py-16 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-4xl font-bold">Why I Keep My RAW Files</h1>
      <p className="text-sm text-gray-500">April 10, 2025 · 3 min read</p>
      <img src="/photos/blog1.jpg" alt="cover" className="w-full rounded" />
      <p className="text-lg leading-relaxed text-gray-700">Coming soon...</p>
    </motion.div>
  );
}
