import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShoppingCart, Download, ExternalLink } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

interface Book {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  price?: string;
  purchaseUrl?: string;
  createdAt?: any;
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const booksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[];
        setBooks(booksData);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="container mx-auto px-4 py-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-4">Books & Publications</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the literary works of Mufti Masud, ranging from personal memoirs to critical theological analysis.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24 bg-accent/20 rounded-3xl">
            <h2 className="text-2xl font-bold mb-2">No books found</h2>
            <p className="text-muted-foreground">Check back soon for new publications.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {books.map((book, i) => (
              <div key={book.id} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}>
                <div className="w-full md:w-1/3">
                  <motion.div 
                    whileHover={{ scale: 1.02, rotate: i % 2 === 0 ? 2 : -2 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all"></div>
                    <img 
                      src={book.coverUrl} 
                      alt={book.title} 
                      className="relative z-10 w-full rounded-2xl shadow-2xl border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </div>
                <div className="w-full md:w-2/3 space-y-6">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-2">{book.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {book.description}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    {book.purchaseUrl && (
                      <a href={book.purchaseUrl} target="_blank" rel="noreferrer" className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <ShoppingCart className="h-5 w-5" /> Buy Now {book.price ? `(${book.price})` : ""}
                      </a>
                    )}
                    <button className="px-8 py-3 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" /> Read Sample
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-24 p-12 rounded-3xl bg-accent/30 text-center">
          <h2 className="text-3xl font-bold mb-4">Looking for more?</h2>
          <p className="text-muted-foreground mb-8">New titles are in the works. Subscribe to the newsletter to stay updated.</p>
          <div className="max-w-md mx-auto flex gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-grow px-6 py-3 rounded-full bg-background border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold">
              Subscribe
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
