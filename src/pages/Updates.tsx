import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Calendar, User, ArrowRight, Clock, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

export default function Updates() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching updates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-4">Latest Updates</h1>
          <p className="text-xl text-muted-foreground">
            Thoughts, essays, and news from Mufti Masud.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-accent/20 rounded-3xl">
            <h2 className="text-2xl font-bold mb-2">No updates yet</h2>
            <p className="text-muted-foreground">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col bg-background border rounded-3xl overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  {post.imageUrl && (
                    <div className="md:w-1/3 aspect-video md:aspect-auto overflow-hidden">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className={cn("p-8 flex-grow flex flex-col", post.imageUrl ? "md:w-2/3" : "w-full")}>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4 uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> 
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Mufti Masud</span>
                    </div>
                    
                    <h2 
                      className="text-2xl md:text-3xl font-bold mb-4 cursor-pointer group-hover:text-primary transition-colors"
                      onClick={() => toggleExpand(post.id)}
                    >
                      {post.title}
                    </h2>
                    
                    <div className="text-muted-foreground mb-6 flex-grow">
                      <p className={cn(expandedId === post.id ? "" : "line-clamp-2")}>
                        {post.content}
                      </p>
                    </div>

                    <AnimatePresence>
                      {expandedId === post.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 border-t mt-4 text-foreground leading-relaxed whitespace-pre-wrap">
                            {/* Full content is already shown above when expanded, 
                                but we could add extra details here if needed */}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      onClick={() => toggleExpand(post.id)}
                      className="text-primary font-bold flex items-center gap-2 self-start mt-auto"
                    >
                      {expandedId === post.id ? (
                        <>Show Less <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Read More <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
