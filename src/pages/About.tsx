import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export default function About() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const q = query(collection(db, "pages"), where("slug", "==", "about"), limit(1));
        const s = await getDocs(q);
        if (!s.empty) {
          setContent(s.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching about page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  const journey = [
    { year: "Early Years", role: "Hafez", desc: "Memorized the entire Quran at a young age, laying the foundation for deep theological study." },
    { year: "Scholarly Path", role: "Mufti", desc: "Attained the rank of Mufti, becoming an expert in Islamic jurisprudence and a community leader." },
    { year: "The Transition", role: "Imam", desc: "Served as an Imam, leading congregations while privately grappling with philosophical questions." },
    { year: "Present", role: "Secular Thinker", desc: "Embraced humanism and secularism, dedicated to critical thinking and intellectual freedom." }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
          <h1 className="text-4xl md:text-6xl font-black mb-8">{content?.title || "About Mufti Masud"}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={content?.imageUrl || "https://picsum.photos/seed/masud-portrait/800/800"} 
                alt="Mufti Masud" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary">A Journey of Truth</h2>
              <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {content?.content || (
                  <>
                    Mufti Masud is a prominent secular blogger, writer, and former Islamic scholar. 
                    His life story is a testament to the power of critical inquiry and the pursuit of intellectual honesty.
                  </>
                )}
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">The Intellectual Evolution</h2>
          <div className="relative border-l-2 border-primary/20 ml-4 md:ml-0 md:border-l-0 md:flex md:justify-between md:gap-4 mb-24">
            {journey.map((item, i) => (
              <div key={i} className="mb-12 md:mb-0 relative pl-8 md:pl-0 md:flex-1">
                <div className="absolute left-[-9px] md:left-1/2 md:translate-x-[-50%] top-0 w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                <div className="md:text-center md:mt-8">
                  <span className="text-sm font-bold text-primary/60 uppercase tracking-widest">{item.year}</span>
                  <h3 className="text-xl font-bold mt-1 mb-2">{item.role}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-accent/30 p-8 md:p-12 rounded-3xl">
            <h2 className="text-3xl font-bold mb-6">Mission & Philosophy</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Mufti Masud's mission is to promote critical thinking, secularism, and human rights within the Bengali-speaking community and beyond. 
                He believes that true progress can only be achieved through the separation of religion and state, and the empowerment of individual reason.
              </p>
              <p>
                Through his writings, videos, and public discourse, he challenges dogma and encourages a society built on empathy, 
                scientific temper, and universal human values.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
