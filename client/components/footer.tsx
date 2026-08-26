"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Image,
  FileAudio,
  FileVideo,
  BookOpen,
  FileImage,
  FileText,
} from "lucide-react";
import Logo from "./logo";
import { useSystemStatus } from "@/hooks/use-system-status";

const converters = [
  { name: "Image Converter", href: "/tools/converters/image", icon: Image },
  { name: "Audio Converter", href: "/tools/converters/audio", icon: FileAudio },
  { name: "Video Converter", href: "/tools/converters/video", icon: FileVideo },
  { name: "eBook Converter", href: "/tools/converters/ebooks", icon: BookOpen },
];

const compressionTools = [
  {
    name: "Image Compression",
    href: "/tools/compression/image",
    icon: FileImage,
  },
  { name: "PDF Compression", href: "/tools/compression/pdf", icon: FileText },
];

export default function Footer() {
  const { status } = useSystemStatus();

  // Temporary fallback for testing
  const testStatus = status || "operational";

  // Get background color for status circle
  const getCircleStyle = (status: string) => {
    switch (status) {
      case "operational":
        return { backgroundColor: "#22c55e" }; // green-500
      case "degraded":
        return { backgroundColor: "#eab308" }; // yellow-500
      case "down":
        return { backgroundColor: "#ef4444" }; // red-500
      case "checking":
      default:
        return { backgroundColor: "#9ca3af" }; // gray-400
    }
  };

  return (
    <footer className="light:bg-white dark:bg-black text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-0">
            <div>
              <h4 className="text-lg font-medium mb-6">Product</h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/features"
                    className="text-base hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-base hover:text-foreground transition-colors"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jobs"
                    className="text-base hover:text-foreground transition-colors"
                  >
                    Job Status
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="text-base hover:text-foreground transition-colors flex items-center"
                  >
                    <motion.div
                      className="w-3 h-3 rounded-full mr-2"
                      style={getCircleStyle(testStatus)}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut" as const,
                      }}
                    />
                    <span>System Status</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-6">Company</h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/about"
                    className="text-base hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-6">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-base hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-base hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-6">Tools</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 md:gap-4">
                <div>
                  <h5 className="text-base font-medium mb-4">Converters</h5>
                  <ul className="space-y-4">
                    {converters.map((tool) => (
                      <li key={tool.name}>
                        <Link
                          href={tool.href}
                          className="text-base hover:text-foreground transition-colors flex items-center"
                        >
                          <tool.icon className="mr-2 h-4 w-4" />
                          <span>{tool.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-base font-medium mb-4">Compression</h5>
                  <ul className="space-y-4">
                    {compressionTools.map((tool) => (
                      <li key={tool.name}>
                        <Link
                          href={tool.href}
                          className="text-base hover:text-foreground transition-colors flex items-center"
                        >
                          <tool.icon className="mr-2 h-4 w-4" />
                          <span>{tool.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 flex justify-between">
            <div className="flex md:items-center flex-col items-start md:flex-row md:gap-4">
              <Logo />
              <p className="mt-4 text-base text-muted-foreground md:mt-0 md:order-1">
                &copy; {new Date().getFullYear()} Cloud, LLC. All rights
                reserved.
              </p>
            </div>
            <div className="hidden md:flex space-x-6 md:order-2">
              <Link
                href="https://github.com/nicholasadamou/cloud"
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
