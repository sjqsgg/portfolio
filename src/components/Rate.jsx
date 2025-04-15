import { motion } from 'framer-motion';

export default function Rate() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto px-4 py-20"
    >
      <h1 className="text-center text-3xl font-light mb-12">
        My goal is to capture you at your best — effortless, natural, and uniquely you.
      </h1>

      <div className="grid md:grid-cols-2 gap-10 text-center">
        <div>
          <h2 className="text-xl font-semibold mb-4">Portrait</h2>
          <p className="text-base text-gray-700 mb-4">
            Ideal for those looking for timeless, Korean-Japanese vintage inspired portrait styles.
            Sessions start from <span className="font-semibold">2 hours</span>, with a base rate of 
            <span className="font-semibold"> €40/hour</span>.
          </p>
          <p className="text-base text-gray-700 mb-4">
            + €30 for one roll of authentic film photos, developed and scanned.
          </p>
          <p className="text-sm text-gray-500 italic">
            Perfect for personal portraits, social media content, or just for fun!
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Event</h2>
          <p className="text-base text-gray-700 mb-4">
            Whether it's a graduation, wedding, or live performance — I've got you covered.
            Event coverage starts at <span className="font-semibold">€45/hour</span>.
          </p>
          <p className="text-base text-gray-700 mb-4">
            For concerts or music gigs, I'm happy to trade a photopass for images — let's collaborate!
          </p>
          <p className="text-sm text-gray-500 italic">
            Fast turnaround & discrete presence guaranteed.
          </p>
        </div>
      </div>

      <div className="text-center mt-12">
        <a href="/contact">
          <button className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition">
            Get in Touch
          </button>
        </a>
      </div>
    </motion.div>
  );
}