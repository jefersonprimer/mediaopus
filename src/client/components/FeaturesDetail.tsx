import React from "react";
import { Shield, Zap, Layout, Smartphone, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";

const detailedFeatures = [
  {
    icon: <Shield className="h-6 w-6 text-blue-500" />,
    title: "Privacy Focused",
    description: "Your images never leave your browser. All processing is done locally using WebAssembly and AI models that run on your hardware."
  },
  {
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    title: "Lightning Fast",
    description: "No uploading, no downloading from servers. Experience instant results with our optimized image processing engine."
  },
  {
    icon: <Layout className="h-6 w-6 text-purple-500" />,
    title: "Professional Quality",
    description: "High-end algorithms ensure your images maintain their sharpness and color accuracy after every transformation."
  },
  {
    icon: <Smartphone className="h-6 w-6 text-green-500" />,
    title: "Mobile Ready",
    description: "Generate all iOS and Android splash screens, icons, and store assets in seconds with our dedicated generator."
  },
  {
    icon: <Globe className="h-6 w-6 text-pink-500" />,
    title: "Always Available",
    description: "As a Progressive Web App, ImageToolkit works offline once loaded. Your tools are always ready when you are."
  },
  {
    icon: <Lock className="h-6 w-6 text-orange-500" />,
    title: "Secure & Clean",
    description: "No accounts, no tracking, no cookies for marketing. Just a clean, professional toolkit for your daily image tasks."
  }
];

export function FeaturesDetail() {
  return (
    <section className="w-full py-16 border-t border-muted/30">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Everything You Need</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Built for developers, designers, and content creators who value speed and privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {detailedFeatures.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-2xl border bg-card/50 hover:bg-card hover:shadow-md transition-all group"
          >
            <div className="mb-4 p-3 rounded-xl bg-background w-fit border shadow-sm group-hover:border-primary/50 transition-colors">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
