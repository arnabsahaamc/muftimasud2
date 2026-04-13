import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { motion } from "motion/react";

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "pages"), where("slug", "==", slug), limit(1));
        const s = await getDocs(q);
        if (!s.empty) {
          setPage(s.docs[0].data());
        } else {
          setPage(null);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-black mb-4">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-black mb-12">{page.title}</h1>
          
          {page.imageUrl && (
            <div className="mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-video">
              <img 
                src={page.imageUrl} 
                alt={page.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {page.content}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
