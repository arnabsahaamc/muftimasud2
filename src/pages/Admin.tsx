import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  setDoc,
  FirestoreError
} from "firebase/firestore";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  FileText, 
  Book, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check,
  Users,
  ShieldCheck,
  Lock,
  User as UserIcon,
  ShieldAlert
} from "lucide-react";
import { cn } from "../lib/utils";
import ReCAPTCHA from "react-google-recaptcha";

interface AdminProps {
  user: User | null;
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const err = error as any;
  const errInfo: FirestoreErrorInfo = {
    error: err.message || String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  console.error(`[Firestore Error] ${operationType} on ${path}:`, err);
  
  if (err.code === "permission-denied") {
    toast.error(`Permission Denied: ${err.message || "You don't have rights"}. (Code: ${err.code})`);
  } else if (err.code === "unavailable") {
    toast.error("Network Error: Firestore is unreachable. Check your internet connection.");
  } else if (err.message?.includes("index")) {
    toast.error("Database Error: A required index is missing. Check console for the setup link.");
  } else if (err.message?.includes("not found") || err.message?.includes("database")) {
    toast.error("Critical: Firestore Database not found! Please ensure you have created the database in your Firebase Console.");
  } else {
    toast.error(`Firestore Error: ${err.message || "Unknown error occurred"}`);
  }
}

export default function Admin({ user }: AdminProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [dbStatus, setDbStatus] = useState<"online" | "offline" | "error">("online");
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "homepage"), (d) => {
      if (d.exists()) setGlobalSettings(d.data());
    }, (err) => {
      console.error("Global settings sync failed:", err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Simple connection check for Firestore
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import("firebase/firestore");
        // Try to get a non-existent doc just to check connection
        await getDocFromServer(doc(db, "_health", "check")).catch((e) => {
          if (e.code === "unavailable") throw e;
        });
        setDbStatus("online");
      } catch (e) {
        console.warn("Firestore connection check failed:", e);
        setDbStatus("offline");
      }
    };
    
    testConnection();
    const interval = setInterval(testConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      // Immediate check for master admin to avoid flicker
      if (user.email === "arnabsahaamc@gmail.com") {
        setUserRole("admin");
      }

      const fetchRole = async () => {
        setIsLoadingRole(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (user.email === "arnabsahaamc@gmail.com") {
            // Master Admin: Ensure document exists and has admin role
            if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
              await setDoc(userDocRef, {
                email: user.email,
                role: "admin",
                displayName: user.displayName || "Main Admin",
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
            setUserRole("admin");
          } else if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // Regular user, create default profile
            await setDoc(userDocRef, {
              email: user.email,
              role: "user",
              displayName: user.displayName || "User",
              createdAt: serverTimestamp()
            });
            setUserRole("user");
          }
        } catch (error) {
          console.error("Error fetching/setting role:", error);
          if (user.email === "arnabsahaamc@gmail.com") {
            setUserRole("admin");
          } else {
            setUserRole("user");
          }
        } finally {
          setIsLoadingRole(false);
        }
      };
      fetchRole();
    } else {
      setUserRole(null);
      setIsLoadingRole(false);
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (globalSettings?.recaptchaEnabled && !captchaValue) {
      toast.error("Please complete the reCAPTCHA");
      return;
    }

    setIsLoggingIn(true);
    try {
      if (isSignUp) {
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Logged in successfully");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        toast.error("Account not found or invalid credentials. If you haven't registered yet, please use the 'Sign Up' option.");
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-accent/30 p-8 md:p-12 rounded-3xl text-center max-w-md w-full border shadow-2xl">
          <div className="mb-8 flex justify-center">
            <div className="p-4 bg-primary rounded-full">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">{isSignUp ? "Create Admin Account" : "Admin Panel"}</h1>
          <p className="text-muted-foreground mb-8">
            {isSignUp ? "Register your credentials to get started." : "Secure access for Mufti Masud's team."}
          </p>
          
          <form onSubmit={handleAuth} className="space-y-4 mb-6 text-left">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {globalSettings?.recaptchaEnabled && (
              <div className="flex flex-col items-center gap-2 py-2">
                {globalSettings.recaptchaSiteKey ? (
                  <ReCAPTCHA
                    sitekey={globalSettings.recaptchaSiteKey}
                    onChange={(val) => setCaptchaValue(val)}
                    theme="light"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 text-xs font-bold">
                    <ShieldAlert className="h-4 w-4" />
                    reCAPTCHA enabled but Site Key is missing
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary font-bold hover:underline mb-6 block w-full"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-accent/30 px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full py-4 border-2 border-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Google Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingRole && !userRole) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager" || isAdmin;

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-red-500/10 p-12 rounded-3xl text-center max-w-md w-full border border-red-500/20">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Access Restricted</h1>
          <p className="text-muted-foreground mb-8">Your account ({user.email}) does not have manager or admin privileges.</p>
          <button
            onClick={() => signOut(auth)}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 space-y-2">
          <div className="p-6 mb-6 bg-primary text-primary-foreground rounded-3xl shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/40">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserIcon className="h-6 w-6" />}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold truncate">{user.displayName || "Staff"}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-tighter font-black bg-white/20 px-2 py-0.5 rounded-full w-fit">
                  <ShieldCheck className="h-3 w-3" /> {userRole}
                </div>
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  dbStatus === "online" ? "bg-green-400" : "bg-red-400"
                )} title={dbStatus === "online" ? "Database Online" : "Database Offline"} />
              </div>
            </div>
          </div>
            <p className="text-xs opacity-70 truncate">{user.email}</p>
          </div>

          <div className="space-y-1">
            {[
              { id: "posts", name: "Updates", icon: FileText, role: "manager" },
              { id: "books", name: "Books", icon: Book, role: "manager" },
              { id: "pages", name: "Pages", icon: LayoutDashboard, role: "manager" },
              { id: "messages", name: "Messages", icon: MessageSquare, role: "manager" },
              { id: "users", name: "User Roles", icon: Users, role: "admin" },
              { id: "settings", name: "Settings", icon: Settings, role: "admin" },
              { id: "health", name: "System Health", icon: ShieldCheck, role: "manager" },
            ].filter(tab => tab.role === "manager" || (tab.role === "admin" && isAdmin)).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" 
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-500/10 transition-all mt-12"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-grow bg-accent/10 rounded-[2.5rem] p-6 md:p-10 border shadow-inner min-h-[600px]">
          {activeTab === "posts" && <AdminPosts />}
          {activeTab === "books" && <AdminBooks />}
          {activeTab === "pages" && <AdminPages />}
          {activeTab === "messages" && <AdminMessages />}
          {activeTab === "users" && isAdmin && <AdminUsers />}
          {activeTab === "settings" && isAdmin && <AdminSettings />}
          {activeTab === "health" && <AdminHealth userRole={userRole} />}
        </main>
      </div>
    </div>
  );
}

// --- Sub-components ---

function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", imageUrl: "" });
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchPosts = async () => {
    setIsSyncing(true);
    try {
      const { getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const s = await getDocs(q);
      setPosts(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLastSynced(new Date());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "posts");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = "posts";
    const loadingToast = toast.loading("Saving update to server...");
    console.log("Starting write to Firestore at path:", path, "Data:", formData);
    
    try {
      if (editingId) {
        await updateDoc(doc(db, path, editingId), { 
          ...formData, 
          updatedAt: serverTimestamp(),
          lastModifiedBy: auth.currentUser?.uid
        });
        toast.success("Update saved successfully", { id: loadingToast });
        console.log("Update successful for ID:", editingId);
      } else {
        const docRef = await addDoc(collection(db, path), { 
          ...formData, 
          createdAt: serverTimestamp(), 
          authorId: auth.currentUser?.uid,
          authorEmail: auth.currentUser?.email
        });
        console.log("Create successful! Document ID:", docRef.id);
        toast.success("Update published successfully", { id: loadingToast });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: "", content: "", imageUrl: "" });
      fetchPosts(); // Refresh list after save
    } catch (error) {
      console.error("Write failed:", error);
      toast.error("Failed to save. Check console for details.", { id: loadingToast });
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this update?")) {
      const path = `posts/${id}`;
      try {
        await deleteDoc(doc(db, "posts", id));
        toast.success("Update deleted");
        fetchPosts(); // Refresh list after delete
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Updates</h2>
          <p className="text-muted-foreground">Create and manage your updates.</p>
          {lastSynced && (
            <p className="text-[10px] text-green-500 font-bold uppercase mt-1">
              Last synced: {lastSynced.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchPosts}
            disabled={isSyncing}
            className="p-4 bg-accent text-accent-foreground rounded-2xl hover:opacity-80 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <Settings className={cn("h-6 w-6", isSyncing && "animate-spin")} />
          </button>
          <button 
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ title: "", content: "", imageUrl: "" }); }}
            className="p-4 bg-primary text-primary-foreground rounded-2xl hover:scale-110 transition-transform shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="bg-background p-8 rounded-[2rem] border shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{editingId ? "Edit Update" : "New Update"}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 hover:bg-accent rounded-full"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Title</label>
              <input 
                placeholder="Enter update title" 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Featured Image URL (Public URL only)</label>
              <input 
                placeholder="https://example.com/image.jpg" 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={formData.imageUrl} 
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Note: Local file paths will not work. Use a public image URL.</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Content</label>
              <textarea 
                placeholder="Write your story..." 
                rows={10} 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none resize-none" 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})}
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition-all">
            {editingId ? "Save Changes" : "Publish Now"}
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {posts.map(post => (
          <div key={post.id} className="bg-background p-6 rounded-3xl border flex justify-between items-center hover:shadow-md transition-all group">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-accent overflow-hidden flex-shrink-0">
                {post.imageUrl ? <img src={post.imageUrl} className="h-full w-full object-cover" /> : <FileText className="h-full w-full p-4 opacity-20" />}
              </div>
              <div>
                <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{post.title}</h4>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{post.createdAt?.toDate()?.toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditingId(post.id); setFormData({ title: post.title, content: post.content, imageUrl: post.imageUrl || "" }); }}
                className="p-3 hover:bg-accent rounded-xl text-primary transition-colors"
              >
                <Edit3 className="h-5 w-5" />
              </button>
              <button onClick={() => handleDelete(post.id)} className="p-3 hover:bg-red-500/10 rounded-xl text-red-500 transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="text-center py-20 opacity-40 italic">No posts found. Start writing!</div>}
      </div>
    </div>
  );
}

function AdminBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", coverUrl: "", purchaseUrl: "", price: "" });
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchBooks = async () => {
    setIsSyncing(true);
    try {
      const { getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
      const s = await getDocs(q);
      const booksData = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setBooks(booksData);
      
      // Auto-seed if empty and user is master admin
      if (booksData.length === 0 && auth.currentUser?.email === "arnabsahaamc@gmail.com") {
        const seedInitialBooks = async () => {
          const initialBooks = [
            {
              title: "নাস্তিক ইমামের হজ",
              description: "A deeply personal and critical account of the Hajj pilgrimage from the perspective of a scholar who has transitioned to secularism. It explores the rituals, the history, and the psychological impact of the journey.",
              coverUrl: "https://picsum.photos/seed/book1/600/800",
              price: "৳ 350",
              purchaseUrl: "#",
              createdAt: serverTimestamp()
            },
            {
              title: "সবটুকুই মোহাম্মদ",
              description: "A comprehensive scholarly analysis of the life, character, and legacy of the Prophet of Islam. Based on primary sources, this book offers a critical perspective often missing from traditional narratives.",
              coverUrl: "https://picsum.photos/seed/book2/600/800",
              price: "৳ 420",
              purchaseUrl: "#",
              createdAt: serverTimestamp()
            }
          ];
          
          for (const book of initialBooks) {
            await addDoc(collection(db, "books"), book);
          }
          toast.success("Initial books imported to database");
          fetchBooks();
        };
        seedInitialBooks();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "books");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = "books";
    const loadingToast = toast.loading("Saving book to library...");
    console.log("Starting book write to Firestore at path:", path, "Data:", formData);

    try {
      if (editingId) {
        await updateDoc(doc(db, path, editingId), { 
          ...formData, 
          updatedAt: serverTimestamp(),
          lastModifiedBy: auth.currentUser?.uid
        });
        toast.success("Book updated successfully", { id: loadingToast });
        console.log("Book update successful for ID:", editingId);
      } else {
        const docRef = await addDoc(collection(db, path), { 
          ...formData, 
          createdAt: serverTimestamp(),
          authorId: auth.currentUser?.uid
        });
        console.log("Book creation successful! ID:", docRef.id);
        toast.success("Book added to library", { id: loadingToast });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: "", description: "", coverUrl: "", purchaseUrl: "", price: "" });
      fetchBooks();
    } catch (error) {
      console.error("Book write failed:", error);
      toast.error("Failed to save book. Check console.", { id: loadingToast });
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this book?")) {
      const path = `books/${id}`;
      try {
        await deleteDoc(doc(db, "books", id));
        toast.success("Book deleted");
        fetchBooks();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Books Library</h2>
          <p className="text-muted-foreground">Manage your published works.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchBooks}
            disabled={isSyncing}
            className="p-4 bg-accent text-accent-foreground rounded-2xl hover:opacity-80 transition-all disabled:opacity-50"
          >
            <Settings className={cn("h-6 w-6", isSyncing && "animate-spin")} />
          </button>
          <button 
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ title: "", description: "", coverUrl: "", purchaseUrl: "", price: "" }); }} 
            className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:opacity-90 transition-all"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="bg-background p-8 rounded-[2rem] border shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{editingId ? "Edit Book" : "New Book"}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 hover:bg-accent rounded-full"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Book Title</label>
                <input 
                  placeholder="Enter book title" 
                  className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Price (e.g. ৳ 350)</label>
                <input 
                  placeholder="৳ 000" 
                  className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Cover Image URL (Public URL only)</label>
              <input 
                placeholder="https://example.com/image.jpg" 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={formData.coverUrl} 
                onChange={e => setFormData({...formData, coverUrl: e.target.value})} 
                required 
              />
              <p className="text-[10px] text-muted-foreground mt-1">Note: Local file paths (e.g. C:\...) will not work. Use a public image URL.</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Purchase Link (Amazon/Rokomari)</label>
              <input 
                placeholder="https://..." 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={formData.purchaseUrl} 
                onChange={e => setFormData({...formData, purchaseUrl: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Description</label>
              <textarea 
                placeholder="What is this book about?" 
                rows={5}
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none resize-none" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                required 
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition-all">
            {editingId ? "Save Changes" : "Add Book"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {books.map(book => (
          <div key={book.id} className="bg-background p-6 rounded-[2rem] border flex gap-6 hover:shadow-lg transition-all group">
            <div className="h-40 w-28 rounded-xl bg-accent overflow-hidden flex-shrink-0 shadow-xl">
              <img src={book.coverUrl} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">{book.title}</h4>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditingId(book.id); setFormData({ title: book.title, description: book.description, coverUrl: book.coverUrl, purchaseUrl: book.purchaseUrl || "", price: book.price || "" }); }}
                      className="p-2 hover:bg-accent rounded-lg text-primary transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(book.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{book.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-primary">{book.price || "Price TBD"}</span>
                {book.purchaseUrl && (
                  <a href={book.purchaseUrl} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-widest font-black hover:underline">
                    View Link
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {books.length === 0 && <div className="text-center py-20 opacity-40 italic col-span-full">No books in the library yet.</div>}
      </div>
    </div>
  );
}

function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchMessages = async () => {
    setIsSyncing(true);
    try {
      const { getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      const s = await getDocs(q);
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "messages");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "messages", id));
      fetchMessages();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `messages/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Inbox</h2>
          <p className="text-muted-foreground">Messages from your readers.</p>
        </div>
        <button 
          onClick={fetchMessages}
          disabled={isSyncing}
          className="p-4 bg-accent text-accent-foreground rounded-2xl hover:opacity-80 transition-all disabled:opacity-50"
        >
          <Settings className={cn("h-6 w-6", isSyncing && "animate-spin")} />
        </button>
      </div>
      <div className="space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className="bg-background p-8 rounded-[2rem] border shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center font-bold text-primary">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{msg.name}</h4>
                  <p className="text-sm text-primary/60">{msg.email}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{msg.createdAt?.toDate()?.toLocaleString()}</p>
            </div>
            <div className="bg-accent/20 p-6 rounded-2xl relative">
              <div className="absolute top-0 left-6 -translate-y-1/2 w-4 h-4 bg-accent/20 rotate-45"></div>
              <p className="text-foreground leading-relaxed italic">"{msg.message}"</p>
            </div>
            <div className="flex justify-end">
              <button onClick={() => handleDelete(msg.id)} className="text-red-500 text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Archive
              </button>
            </div>
          </div>
        ))}
        {messages.length === 0 && <div className="text-center py-20 opacity-40 italic">Inbox is empty.</div>}
      </div>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const fetchUsers = async () => {
    setIsSyncing(true);
    try {
      const { getDocs } = await import("firebase/firestore");
      const s = await getDocs(collection(db, "users"));
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "users");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStartEdit = (user: any) => {
    setEditingId(user.id);
    setEditName(user.displayName || "");
    setEditRole(user.role || "user");
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), {
        displayName: editName,
        role: editRole
      });
      toast.success("User updated successfully");
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("User removed");
      fetchUsers();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  const handleInvite = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsInviting(true);
    try {
      await addDoc(collection(db, "users"), {
        email: newEmail.toLowerCase(),
        role: "manager",
        displayName: "Invited Member",
        createdAt: serverTimestamp()
      });
      toast.success(`Invitation sent to ${newEmail}`);
      setNewEmail("");
      fetchUsers();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "users");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Team Management</h2>
          <p className="text-muted-foreground">Manage roles and details of your collaborators.</p>
        </div>
        <button 
          onClick={fetchUsers}
          disabled={isSyncing}
          className="p-4 bg-accent text-accent-foreground rounded-2xl hover:opacity-80 transition-all disabled:opacity-50"
        >
          <Settings className={cn("h-6 w-6", isSyncing && "animate-spin")} />
        </button>
      </div>

      <div className="bg-background p-8 rounded-[2rem] border shadow-xl">
        <h3 className="font-bold mb-6">User List</h3>
        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl bg-accent/5 border gap-4">
              {editingId === u.id ? (
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Display Name"
                    className="p-3 rounded-xl bg-background border outline-none focus:ring-2 ring-primary/20"
                  />
                  <select 
                    value={editRole} 
                    onChange={(e) => setEditRole(e.target.value)}
                    className="p-3 rounded-xl bg-background border outline-none focus:ring-2 ring-primary/20 font-bold"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                    {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{u.displayName || "Anonymous User"}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{u.email}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                        u.role === 'admin' ? "bg-red-500/10 text-red-500" : 
                        u.role === 'manager' ? "bg-blue-500/10 text-blue-500" : "bg-gray-500/10 text-gray-500"
                      )}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId === u.id ? (
                  <>
                    <button 
                      onClick={() => handleSaveEdit(u.id)}
                      className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-3 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleStartEdit(u)}
                      className="p-3 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.email === "arnabsahaamc@gmail.com"}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && !isSyncing && (
            <div className="text-center py-12 opacity-40 italic">No users found.</div>
          )}
        </div>
      </div>

      <div className="p-8 bg-primary text-primary-foreground rounded-[2rem] shadow-xl">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Plus className="h-5 w-5" /> Add Team Member</h3>
        <p className="text-sm opacity-80 mb-6">Note: Users must first sign in once to appear in this list, or you can manually add their UID if known.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            placeholder="User Email" 
            className="flex-grow p-4 rounded-2xl bg-white/10 border-none text-white placeholder:text-white/40 outline-none"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button 
            onClick={handleInvite}
            disabled={isInviting}
            className="px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
          >
            {isInviting ? "Inviting..." : "Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", slug: "", content: "", imageUrl: "" });
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchPages = async () => {
    setIsSyncing(true);
    try {
      const { getDocs } = await import("firebase/firestore");
      const s = await getDocs(collection(db, "pages"));
      const pagesData = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setPages(pagesData);

      // Seed About page if empty
      if (pagesData.length === 0 && auth.currentUser?.email === "arnabsahaamc@gmail.com") {
        const seedAbout = async () => {
          await addDoc(collection(db, "pages"), {
            title: "About Us",
            slug: "about",
            content: "Mufti Masud is a prominent secular blogger, writer, and former Islamic scholar. His life story is a testament to the power of critical inquiry and the pursuit of intellectual honesty.",
            imageUrl: "https://picsum.photos/seed/masud-portrait/800/800",
            updatedAt: serverTimestamp()
          });
          fetchPages();
        };
        seedAbout();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "pages");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Saving page...");
    try {
      if (editingId) {
        await updateDoc(doc(db, "pages", editingId), { ...formData, updatedAt: serverTimestamp() });
        toast.success("Page updated", { id: loadingToast });
      } else {
        await addDoc(collection(db, "pages"), { ...formData, updatedAt: serverTimestamp() });
        toast.success("Page created", { id: loadingToast });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: "", slug: "", content: "", imageUrl: "" });
      fetchPages();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "pages");
      toast.dismiss(loadingToast);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this page?")) {
      try {
        await deleteDoc(doc(db, "pages", id));
        toast.success("Page deleted");
        fetchPages();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, "pages");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Pages</h2>
          <p className="text-muted-foreground">Manage static and dynamic page content.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPages} className="p-4 bg-accent text-accent-foreground rounded-2xl hover:opacity-80 transition-all">
            <Settings className={cn("h-6 w-6", isSyncing && "animate-spin")} />
          </button>
          <button 
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ title: "", slug: "", content: "", imageUrl: "" }); }}
            className="p-4 bg-primary text-primary-foreground rounded-2xl hover:scale-110 transition-transform shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="bg-background p-8 rounded-[2rem] border shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{editingId ? "Edit Page" : "New Page"}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 hover:bg-accent rounded-full"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Page Title</label>
              <input 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Slug (URL path)</label>
              <input 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={formData.slug} 
                onChange={e => setFormData({...formData, slug: e.target.value})}
                placeholder="about-us"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Featured Image URL</label>
            <input 
              className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Content (Markdown/HTML supported)</label>
            <textarea 
              rows={15} 
              className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none resize-none" 
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg">
            {editingId ? "Update Page" : "Create Page"}
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {pages.map(page => (
          <div key={page.id} className="bg-background p-6 rounded-3xl border flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg">{page.title}</h4>
              <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditingId(page.id); setFormData({ title: page.title, slug: page.slug, content: page.content, imageUrl: page.imageUrl || "" }); }}
                className="p-3 hover:bg-accent rounded-xl text-primary"
              >
                <Edit3 className="h-5 w-5" />
              </button>
              <button onClick={() => handleDelete(page.id)} className="p-3 hover:bg-red-500/10 rounded-xl text-red-500">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminHealth({ userRole }: { userRole: string | null }) {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isTestingWrite, setIsTestingWrite] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { getDocFromServer, doc } = await import("firebase/firestore");
        // Try to read a document that likely doesn't exist to check rules
        const testDoc = await getDocFromServer(doc(db, 'users', auth.currentUser?.uid || 'health-check-test'));
        setStatus("connected");
        setError(null);
      } catch (err: any) {
        console.error("CRITICAL: Connection test failed with full error:", err);
        setStatus("error");
        setError(`${err.code}: ${err.message}`);
        
        if (err.code === "permission-denied") {
          toast.error("Permission Denied. Please check if Firestore is enabled and rules are deployed.");
        }
      }
    };
    testConnection();

    // Fetch stats using one-time getDocs instead of onSnapshot to avoid stream errors
    const fetchStats = async () => {
      const { getDocs, collection } = await import("firebase/firestore");
      const collections = ["posts", "books", "messages", "users", "settings"];
      
      for (const col of collections) {
        try {
          const s = await getDocs(collection(db, col));
          setStats(prev => ({ ...prev, [col]: s.docs.length }));
        } catch (err: any) {
          console.warn(`Stats fetch failed for ${col}:`, err.message);
        }
      }
    };
    fetchStats();
  }, []);

  const runWriteTest = async () => {
    if (!auth.currentUser) {
      toast.error("You must be signed in to run the write test.");
      return;
    }
    setIsTestingWrite(true);
    try {
      const testRef = doc(collection(db, "_health_tests"));
      await setDoc(testRef, {
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        test: "write_check"
      });
      toast.success("Write test successful! Your connection is fully functional.");
    } catch (err: any) {
      console.error("Write test failed:", err);
      toast.error(`Write test failed: ${err.message}`);
    } finally {
      setIsTestingWrite(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">System Health</h2>
          <p className="text-muted-foreground">Diagnose connection and permission issues.</p>
        </div>
        <button 
          onClick={runWriteTest}
          disabled={isTestingWrite}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isTestingWrite ? "Testing..." : "Run Write Test"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background p-8 rounded-[2rem] border shadow-xl">
          <h3 className="font-bold mb-4">Connection</h3>
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-4 w-4 rounded-full animate-pulse",
              status === "connected" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-yellow-500"
            )} />
            <span className="font-bold uppercase tracking-widest text-xs">
              {status === "connected" ? "Online" : status === "error" ? "Error" : "Checking..."}
            </span>
          </div>
          {error && <p className="mt-4 text-[10px] text-red-500 bg-red-500/10 p-3 rounded-xl font-mono break-all">{error}</p>}
        </div>

        <div className="bg-background p-8 rounded-[2rem] border shadow-xl">
          <h3 className="font-bold mb-4">Identity</h3>
          <div className="space-y-2 text-xs">
            <p className="flex justify-between"><span>Project:</span> <span className="font-mono opacity-60">mufti-masud</span></p>
            <p className="flex justify-between"><span>Database:</span> <span className="font-mono opacity-60">(default)</span></p>
            <p className="flex justify-between"><span>Role:</span> <span className="font-bold text-primary uppercase">{userRole || "None"}</span></p>
            <p className="flex justify-between"><span>Email:</span> <span className="font-mono opacity-60">{auth.currentUser?.email}</span></p>
            <p className="flex justify-between"><span>Verified:</span> <span className="font-bold">{auth.currentUser?.emailVerified ? "YES" : "NO"}</span></p>
            <p className="flex justify-between"><span>UID:</span> <span className="font-mono text-[8px] opacity-40">{auth.currentUser?.uid}</span></p>
          </div>
        </div>

        <div className="bg-background p-8 rounded-[2rem] border shadow-xl">
          <h3 className="font-bold mb-4">Database Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-black">
            {Object.entries(stats).map(([name, count]) => (
              <div key={name} className="bg-accent/20 p-2 rounded-lg flex justify-between">
                <span className="opacity-40">{name}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-accent/20 p-8 rounded-[2rem] border italic text-sm text-muted-foreground space-y-4">
        <p>If "Database Stats" shows 0 for collections you know have data, it's a sign of a <b>Read Permission</b> issue. If "Run Write Test" fails, it's a <b>Write Permission</b> or <b>Connection</b> issue.</p>
        
        <div className="not-italic bg-background/50 p-6 rounded-2xl border-2 border-primary/20">
          <h4 className="font-bold text-primary mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Database Setup Guide</h4>
          <p className="text-xs mb-4 text-red-500 font-bold">If you see "Missing or insufficient permissions", it usually means the database hasn't been created yet or the rules haven't finished deploying.</p>
          <ol className="list-decimal list-inside space-y-2 text-xs">
            <li>Go to your <a href="https://console.firebase.google.com/project/mufti-masud/firestore" target="_blank" className="underline font-bold text-primary">Firebase Console</a></li>
            <li>Ensure you see a database named <b>"(default)"</b>.</li>
            <li>If you see a <b>"Create database"</b> button, click it and follow the steps (Production mode).</li>
            <li>If the database exists, wait 1-2 minutes for the security rules I just deployed to take effect.</li>
            <li>Refresh this page and click <b>"Run Write Test"</b>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function AdminSettings() {
  const [settings, setSettings] = useState({
    heroHeadline: "MUFTI MASUD",
    heroIntro: "Secular Blogger, Writer & Ex-Muslim Scholar. Bridging the gap between tradition and reason.",
    siteTitle: "Mufti Masud | Secular Blogger & Writer",
    siteDescription: "Official website of Mufti Masud, exploring secularism, humanism, and critical thinking.",
    keywords: "Mufti Masud, Secularism, Humanism, Critical Thinking, Bengali Blogger",
    journeyImageThen: "",
    journeyImageNow: "",
    journeyLabelThen: "Mufti Maulana",
    journeyLabelNow: "Secular Thinker",
    journeyIntro: "A journey from traditional scholar (Mufti Maulana) to secular humanism, bridging the gap between faith and reason.",
    recaptchaEnabled: false,
    recaptchaSiteKey: "",
    recaptchaSecretKey: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSettings = async () => {
    setIsSyncing(true);
    try {
      const { getDoc } = await import("firebase/firestore");
      const d = await getDoc(doc(db, "settings", "homepage"));
      if (d.exists()) {
        setSettings(prev => ({ ...prev, ...d.data() }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "settings/homepage");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "homepage"), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success("Settings saved successfully");
      fetchSettings();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "settings/homepage");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Global Settings</h2>
          <p className="text-muted-foreground">Configure your website's behavior.</p>
        </div>
        <button 
          onClick={fetchSettings}
          disabled={isSyncing}
          className="p-4 bg-accent text-accent-foreground rounded-2xl hover:opacity-80 transition-all disabled:opacity-50"
        >
          <Settings className={cn("h-6 w-6", isSyncing && "animate-spin")} />
        </button>
      </div>
      <div className="bg-background p-10 rounded-[2.5rem] border shadow-xl space-y-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold">Google reCAPTCHA v2</h4>
              <p className="text-sm text-muted-foreground">Enable advanced spam protection on the contact and login forms.</p>
            </div>
            <button 
              onClick={() => { 
                const newState = !settings.recaptchaEnabled;
                setSettings({...settings, recaptchaEnabled: newState}); 
                toast.info(`reCAPTCHA ${newState ? 'enabled' : 'disabled'}. Don't forget to click "Save All Settings" below.`); 
              }}
              className={cn(
                "w-16 h-9 rounded-full relative transition-colors duration-300",
                settings.recaptchaEnabled ? "bg-green-500" : "bg-accent"
              )}
            >
              <div className={cn(
                "absolute top-1 w-7 h-7 rounded-full bg-white shadow-md transition-all duration-300",
                settings.recaptchaEnabled ? "left-8" : "left-1"
              )} />
            </button>
          </div>
          
          {settings.recaptchaEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-6 bg-accent/10 rounded-2xl border border-primary/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest mb-2 block">reCAPTCHA Site Key</label>
                  <input 
                    className="w-full p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none" 
                    value={settings.recaptchaSiteKey}
                    onChange={(e) => setSettings({...settings, recaptchaSiteKey: e.target.value})}
                    placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest mb-2 block">reCAPTCHA Secret Key</label>
                  <input 
                    type="password"
                    className="w-full p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none" 
                    value={settings.recaptchaSecretKey}
                    onChange={(e) => setSettings({...settings, recaptchaSecretKey: e.target.value})}
                    placeholder="••••••••••••••••••••••••••••"
                  />
                </div>
              </div>
              <p className="mt-2 text-[10px] opacity-60 italic text-red-500/80">Note: Secret Key is used for server-side verification. Keep it private.</p>
            </motion.div>
          )}
        </div>
        
        <div className="pt-10 border-t">
          <h4 className="text-xl font-bold mb-6">Homepage Customization</h4>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Hero Headline</label>
              <input 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={settings.heroHeadline}
                onChange={(e) => setSettings({...settings, heroHeadline: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Hero Intro Text</label>
              <textarea 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none resize-none" 
                rows={3} 
                value={settings.heroIntro}
                onChange={(e) => setSettings({...settings, heroIntro: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="pt-10 border-t">
          <h4 className="text-xl font-bold mb-6">SEO & Metadata</h4>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Site Title</label>
              <input 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={settings.siteTitle}
                onChange={(e) => setSettings({...settings, siteTitle: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Site Description</label>
              <textarea 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none resize-none" 
                rows={3} 
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Keywords (comma separated)</label>
              <input 
                className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                value={settings.keywords}
                onChange={(e) => setSettings({...settings, keywords: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="pt-10 border-t">
          <h4 className="text-xl font-bold mb-6">Journey Section Customization</h4>
          <div className="space-y-6 mb-8">
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Section Intro Text</label>
            <textarea 
              className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none resize-none" 
              rows={2} 
              value={settings.journeyIntro}
              onChange={(e) => setSettings({...settings, journeyIntro: e.target.value})}
              placeholder="A journey from traditional scholar (Mufti Maulana) to secular humanism..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h5 className="font-bold text-sm opacity-50 uppercase tracking-widest">The Past (Then)</h5>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Label</label>
                <input 
                  className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                  value={settings.journeyLabelThen} 
                  onChange={e => setSettings({...settings, journeyLabelThen: e.target.value})} 
                  placeholder="Mufti Maulana"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Image URL</label>
                <input 
                  className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                  value={settings.journeyImageThen} 
                  onChange={e => setSettings({...settings, journeyImageThen: e.target.value})} 
                  placeholder="https://example.com/mufti.jpg"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <h5 className="font-bold text-sm opacity-50 uppercase tracking-widest">The Present (Now)</h5>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Label</label>
                <input 
                  className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                  value={settings.journeyLabelNow} 
                  onChange={e => setSettings({...settings, journeyLabelNow: e.target.value})} 
                  placeholder="Secular Thinker"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Image URL</label>
                <input 
                  className="w-full p-4 rounded-2xl border bg-accent/20 focus:ring-2 focus:ring-primary outline-none" 
                  value={settings.journeyImageNow} 
                  onChange={e => setSettings({...settings, journeyImageNow: e.target.value})} 
                  placeholder="https://example.com/secular.jpg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save All Settings"}
          </button>
        </div>

        <div className="pt-10 border-t">
          <h4 className="text-xl font-bold mb-4">System Information</h4>
          <div className="bg-accent/10 p-4 rounded-2xl font-mono text-xs space-y-1">
            <p><span className="opacity-50">Project ID:</span> mufti-masud</p>
            <p><span className="opacity-50">Database:</span> (default)</p>
            <p><span className="opacity-50">Status:</span> Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
