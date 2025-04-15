import { motion } from "framer-motion";

export default function Blog() {
  const posts = [
    {
      title: "5 tricks to get a decent film camera on marktplaats",
      tags: "Film | Photography Gear | The Art Of Photography",
      summary:
        "Coming soon...",
      date: "April 10, 2025",
      readTime: "3 min read",
      image: "/photos/Screenshot 2025-04-15 at 09.26.56.png",
    },
    {
        title: "5 tricks to get a decent film camera on marktplaats",
        tags: "Film | Photography Gear | The Art Of Photography",
        summary:
            "Coming soon...",
        date: "April 10, 2025",
        readTime: "3 min read",
        image: "/photos/Screenshot 2025-04-15 at 09.26.56.png",
    },
    {
        title: "5 tricks to get a decent film camera on marktplaats",
        tags: "Film | Photography Gear | The Art Of Photography",
        summary:
          "Coming soon...",
        date: "April 10, 2025",
        readTime: "3 min read",
        image: "/photos/Screenshot 2025-04-15 at 09.26.56.png",
    },
  ];

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {posts.map((post, index) => (
          <div key={index} className="space-y-4">
            <img src={post.image} alt={post.title} className="w-full object-cover rounded" />
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-500">{post.tags}</p>
            <p className="text-gray-700">{post.summary}</p>
            <p className="text-sm text-gray-400">
              {post.date} · {post.readTime}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}