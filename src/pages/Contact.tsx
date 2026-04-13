import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "sonner";
import { Send, Mail, MapPin, Phone, ShieldAlert } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "homepage"), (d) => {
      if (d.exists()) setSettings(d.data());
    }, (err) => {
      console.error("Settings sync failed:", err);
    });
    return () => unsubscribe();
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    if (settings?.recaptchaEnabled && !captchaValue) {
      toast.error("Please complete the reCAPTCHA");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "messages"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast.success("Message sent successfully! I'll get back to you soon.");
      reset();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-black mb-8">Get in Touch</h1>
            <p className="text-xl text-muted-foreground mb-12">
              Have a question, feedback, or just want to say hello? Use the form or reach out via social media.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-accent">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Email</h3>
                  <p className="text-muted-foreground">contact@muftimasud.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-accent">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Location</h3>
                  <p className="text-muted-foreground">Dhaka, Bangladesh (Global Presence)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-accent">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Social</h3>
                  <p className="text-muted-foreground">YouTube, Facebook, Twitter</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-accent/30 p-8 md:p-12 rounded-3xl border"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest">Name</label>
                <input
                  {...register("name")}
                  className="w-full px-6 py-4 rounded-2xl bg-background border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Your Name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest">Email</label>
                <input
                  {...register("email")}
                  className="w-full px-6 py-4 rounded-2xl bg-background border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest">Message</label>
                <textarea
                  {...register("message")}
                  rows={5}
                  className="w-full px-6 py-4 rounded-2xl bg-background border focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  placeholder="How can I help you?"
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>

              {settings?.recaptchaEnabled && (
                <div className="flex flex-col items-center gap-2">
                  {settings.recaptchaSiteKey ? (
                    <ReCAPTCHA
                      sitekey={settings.recaptchaSiteKey}
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
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : (
                  <>
                    Send Message <Send className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
