"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import WatermarkLogo from "./WatermarkLogo";
import InstagramIcon from "./icons/InstagramIcon";
import MailIcon from "./icons/MailIcon";
import WhatsAppIcon from "./icons/WhatsAppIcon";
import DoubleBorder from "./ui/DoubleBorder";
import Input from "./ui/Input";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ContactButton from "./ui/ContactButton";

const DrawerContactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "Enter a valid 10-digit phone number",
    ),
  message: z.string().optional(),
  ts: z.number().optional(),
});

type DrawerContactValues = z.infer<typeof DrawerContactSchema>;

const LINKS = [
  { name: "Projects", href: "/projects" },
  { name: "About", href: "/about" },
  { name: "Press", href: "/press" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar2() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMsgFocused, setIsMsgFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DrawerContactValues>({
    resolver: zodResolver(DrawerContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      ts: Date.now(),
    },
  });

  useEffect(() => {
    if (!isDrawerOpen) {
      reset();
    }
  }, [isDrawerOpen, reset]);

  const handleFormSubmit = async (data: DrawerContactValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const postData = {
      ...data,
      ts: Date.now(),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      if (!res.ok) throw new Error("Request failed");
      setIsSent(true);

      // Track successful contact drawer submission in GA4
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "contact_form_submit", {
          form_type: "navbar_drawer",
        });
      }

      setTimeout(() => {
        setIsSent(false);
      }, 5000);
      reset();
    } catch (error) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Return null if on studio route to avoid layout overlap in Sanity CMS
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      data-fixed=""
      className={cn(
        "fixed top-0 left-0 w-full z-50 text-white font-medium flex justify-center items-center transition-all duration-300 ease-in-out",
        isScrolled
          ? "h-20 shadow backdrop-blur-md bg-taupe-900/5"
          : "h-26 shadow-none backdrop-blur-none bg-transparent",
      )}
      style={{ viewTransitionName: "main-navbar" } as React.CSSProperties}>
      {/* Absolute background layer to smoothly fade the linear gradient without snapping */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-b from-taupe-900/90 to-taupe-800/80 transition-opacity duration-300 ease-in-out -z-10",
          isScrolled ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      <div className="flex-1 flex items-center justify-between px-4 md:px-6 max-w-[1800px] mx-auto">
        {/* Left: Logo (fixed width to balance layout) */}
        <div className="w-[200px] shrink-0">
          <Link href="/">
            <Image
              src="/assets/logo_sdg-horizontal.svg"
              alt="Sarvian Design Group"
              loading="eager"
              width={0}
              height={0}
              sizes="200px"
              className="brightness-0 invert"
              style={{
                width: "200px",
                height: "auto",
              }}
              priority
            />
          </Link>
        </div>

        {/* Center: Centered Navigation Links */}
        <ul className="flex items-center gap-10">
          {LINKS.map((link) => (
            <li key={link.href}>
              {link.name === "Contact" ? (
                <Drawer
                  direction="right"
                  duration={1000}
                  open={isDrawerOpen}
                  onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <button className="relative text-lg uppercase group py-1 tracking-wide cursor-pointer text-white font-medium hover:text-white/80 transition-colors bg-transparent border-none outline-none">
                      {link.name}
                      <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-white transition-all duration-300 -translate-x-1/2 group-hover:w-full" />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-cream-200">
                    <DrawerHeader className="relative pb-6">
                      <DrawerTitle className="text-4xl tracking-tight font-semibold text-taupe-800 pl-2">
                        Contact Us
                      </DrawerTitle>
                      <DrawerDescription className="text-taupe-600 text-lg pl-2">
                        Let's make something amazing together.
                      </DrawerDescription>
                      <DoubleBorder left="left-2" />
                    </DrawerHeader>
                    {isSent ? (
                      <div className="px-8 py-20 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-2">
                          <Check className="w-8 h-8 text-accent" />
                        </div>
                        <p className="text-3xl font-light text-taupe-800">
                          Message Sent
                        </p>
                        <p className="text-base text-taupe-600 max-w-sm leading-relaxed">
                          Thank you for reaching out. We will contact you soon
                          to discuss your vision.
                        </p>
                      </div>
                    ) : (
                      <div className="px-8 py-10 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                          {/* Left Section: Branding & Info */}
                          <div className="lg:col-span-5 space-y-8">
                            <div className="space-y-4">
                              <p className="text-base text-taupe-600 leading-relaxed">
                                From grand architectural concepts to the finest
                                custom interior details, we craft spaces with
                                precision and purpose. Let's start a
                                conversation about your vision.
                              </p>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-border/30">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-taupe-500 font-semibold mb-1">
                                  General Inquiries
                                </p>
                                <a
                                  href="mailto:osh@sarviandg.com"
                                  className="text-sm font-sans font-medium text-accent hover:underline">
                                  osh@sarviandg.com
                                </a>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-taupe-500 font-semibold mb-1">
                                  Call Us
                                </p>
                                <a
                                  href="tel:+19544444803"
                                  className="text-sm font-sans font-medium text-accent hover:underline">
                                  954-444-4803
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Right Section: Form */}
                          <div className="lg:col-span-7 space-y-8">
                            <form
                              onSubmit={handleSubmit(handleFormSubmit)}
                              className="space-y-6">
                              <div>
                                <Input
                                  placeholder="Your Name *"
                                  aria-invalid={!!errors.name || undefined}
                                  {...register("name")}
                                />
                                {errors.name && (
                                  <p className="mt-1 text-xs text-red-600 font-semibold pl-2">
                                    {errors.name.message}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Input
                                  placeholder="Your Email *"
                                  type="email"
                                  aria-invalid={!!errors.email || undefined}
                                  {...register("email")}
                                />
                                {errors.email && (
                                  <p className="mt-1 text-xs text-red-600 font-semibold pl-2">
                                    {errors.email.message}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Input
                                  placeholder="Contact number *"
                                  type="tel"
                                  aria-invalid={!!errors.phone || undefined}
                                  {...register("phone")}
                                />
                                {errors.phone && (
                                  <p className="mt-1 text-xs text-red-600 font-semibold pl-2">
                                    {errors.phone.message}
                                  </p>
                                )}
                              </div>

                              <div className="relative w-full">
                                <textarea
                                  placeholder="Tell us about your project"
                                  rows={4}
                                  className="flex w-full bg-transparent border-none px-2 py-2 text-base placeholder:text-taupe-400 placeholder:font-light focus-visible:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-taupe-800 resize-none animate-none"
                                  onFocus={() => setIsMsgFocused(true)}
                                  {...register("message", {
                                    onBlur: () => setIsMsgFocused(false),
                                  })}
                                />
                                <DoubleBorder
                                  left="left-0"
                                  borderColor={
                                    isMsgFocused ? "bg-accent" : "bg-border/30"
                                  }
                                  className="transition-all duration-300"
                                />
                              </div>

                              {submitError && (
                                <p className="text-sm text-red-600 font-medium">
                                  {submitError}
                                </p>
                              )}

                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded text-cream-100 bg-accent hover:bg-taupe-800 text-lg font-medium uppercase focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent hover:cursor-pointer hover:shadow hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-275 ease-[cubic-bezier(.6,.2,.1,1)] disabled:opacity-55">
                                {isSubmitting ? "Sending..." : "Send Message"}
                              </button>
                            </form>
                          </div>
                        </div>

                        {/* Social Icons - positioned at the bottom of the panel, centered globally */}
                        <div className="flex items-center gap-8 mt-42 justify-center w-full">
                          <a
                            href="https://www.instagram.com/sarviandesigngroup/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram (opens in a new tab)"
                            className="text-taupe-800 hover:text-accent transition-colors duration-200 flex items-center justify-center w-[30px] h-[30px]">
                            <InstagramIcon size={30} color="currentColor" />
                          </a>
                          <a
                            href="mailto:osh@sarviandg.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Send email to osh@sarviandg.com (opens in a new tab)"
                            className="text-taupe-800 hover:text-accent transition-colors duration-200 flex items-center justify-center w-[32px] h-[32px]">
                            <MailIcon size={32} color="currentColor" />
                          </a>
                          <a
                            href="https://wa.me/16466394147"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Chat on WhatsApp with +1 (646) 639-4147 (opens in a new tab)"
                            className="text-taupe-800 hover:text-accent transition-colors duration-200 flex items-center justify-center w-[30px] h-[30px]">
                            <WhatsAppIcon size={26} color="currentColor" />
                          </a>
                        </div>
                      </div>
                    )}
                    <WatermarkLogo
                      className="bottom-5 left-1/2 -translate-x-1/2 hidden lg:block opacity-5"
                      rotation={-20}
                      size={500}
                      gradientFrom="var(--color-accent)" // Official SDG Gold Accent
                      gradientTo="var(--color-cream-300)" // Soft contrasting cream
                    />
                  </DrawerContent>
                </Drawer>
              ) : (
                <Link
                  href={link.href}
                  className="relative text-lg uppercase group py-1 tracking-wide">
                  {link.name}
                  <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-white transition-all duration-300 -translate-x-1/2 group-hover:w-full" />
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Right: CTA Button (matching width of logo container for perfect centering) */}
        <div className="w-[200px] flex justify-end shrink-0">
          <ContactButton location="navbar" className="bg-white text-foreground hover:bg-accent hover:text-white">
            Let's Talk
          </ContactButton>
        </div>
      </div>
    </nav>
  );
}
