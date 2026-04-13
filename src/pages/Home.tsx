import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, MessageSquare, Youtube, Facebook, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { collection, query, limit, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    heroHeadline: "MUFTI MASUD",
    heroIntro: "Secular Blogger, Writer & Ex-Muslim Scholar. Bridging the gap between tradition and reason.",
    siteTitle: "Mufti Masud | Secular Blogger & Writer",
    siteDescription: "Official website of Mufti Masud, exploring secularism, humanism, and critical thinking.",
    keywords: "Mufti Masud, Secularism, Humanism, Critical Thinking, Bengali Blogger",
    journeyImageThen: "https://picsum.photos/seed/mufti-then/800/1000",
    journeyImageNow: "https://picsum.photos/seed/secular-now/800/1000",
    journeyLabelThen: "Mufti Maulana",
    journeyLabelNow: "Secular Thinker",
    journeyIntro: "A journey from traditional scholar (Mufti Maulana) to secular humanism, bridging the gap between faith and reason."
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Featured Books
      try {
        const booksQ = query(collection(db, "books"), orderBy("createdAt", "desc"), limit(2));
        const booksSnapshot = await getDocs(booksQ);
        setFeaturedBooks(booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching books:", error);
      }

      // Fetch Latest Updates
      try {
        const updatesQ = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(3));
        const updatesSnapshot = await getDocs(updatesQ);
        setLatestUpdates(updatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching updates:", error);
      }

      // Fetch Settings
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "homepage"));
        if (settingsDoc.exists()) {
          setSettings(prev => ({ ...prev, ...settingsDoc.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      <Helmet>
        <title>{settings.siteTitle}</title>
        <meta name="description" content={settings.siteDescription} />
        <meta name="keywords" content={settings.keywords} />
      </Helmet>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] py-20 flex items-center justify-center overflow-hidden bg-background">
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 uppercase">
              {settings.heroHeadline.split(' ').map((word, i) => (
                <span key={i} className={i === 1 ? "text-primary/40" : ""}>
                  {word}{" "}
                </span>
              ))}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium">
              {settings.heroIntro}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/updates" className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                Read Updates <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/books" className="px-8 py-4 border-2 border-primary rounded-full font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                Explore Books
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Transformation Journey Section */}
      <section className="py-16 bg-accent/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black mb-4"
            >
              The Path of Transformation
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              {settings.journeyIntro || "A journey from traditional scholar (Mufti Maulana) to secular humanism, bridging the gap between faith and reason."}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <img 
                  src={settings.journeyImageThen} 
                  alt="Traditional Path" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-125"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <span className="text-white font-black tracking-tighter text-xs uppercase mb-1">The Past</span>
                  <h3 className="text-2xl font-black text-white">{settings.journeyLabelThen || "Mufti Maulana"}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <img 
                  src={settings.journeyImageNow} 
                  alt="Secular Path" 
                  className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <span className="text-white font-black tracking-tighter text-xs uppercase mb-1">The Present</span>
                  <h3 className="text-2xl font-black text-white">{settings.journeyLabelNow || "Secular Thinker"}</h3>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Latest Updates</h2>
              <p className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">Latest update about Mufti Masud</p>
            </div>
            <Link to="/updates" className="text-primary font-bold flex items-center gap-1 hover:underline">
              View All Updates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestUpdates.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group bg-accent/10 rounded-3xl border p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  <Link to="/updates">{post.title}</Link>
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                  {post.content}
                </p>
                <Link to="/updates" className="text-primary font-bold text-sm flex items-center gap-1">
                  Read More <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
            {latestUpdates.length === 0 && (
              <div className="col-span-full text-center py-12 opacity-50 italic">
                No updates posted yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Featured Books</h2>
              <p className="text-muted-foreground text-sm">Deep dives into theology, history, and personal journey.</p>
            </div>
            <Link to="/books" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {featuredBooks.map((book, i) => (
              <motion.div
                key={book.id}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-3xl bg-background border shadow-xl"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-cover transition-transform duration-700 scale-110 group-hover:scale-125" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{book.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{book.description}</p>
                  <Link to="/books" className="text-primary font-bold text-sm flex items-center gap-2">
                    Learn More <BookOpen className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
            {featuredBooks.length === 0 && (
              <div className="col-span-full text-center py-12 opacity-50 italic">
                No featured books available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social CTA */}
      <section className="py-24 bg-primary text-primary-foreground overflow-hidden relative">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Join the Conversation</h2>
          <p className="text-xl opacity-80 max-w-2xl mx-auto mb-12">
            Follow me on social media for daily insights, live discussions, and community updates.
          </p>
          <div className="flex justify-center gap-8">
            <a href="https://www.youtube.com/@Mufti-Masud" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
              <div className="p-6 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <Youtube className="h-10 w-10" />
              </div>
              <span className="font-bold">YouTube</span>
            </a>
            <a href="https://www.facebook.com/murtad.masud" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
              <div className="p-6 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <Facebook className="h-10 w-10" />
              </div>
              <span className="font-bold">Facebook</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
