import React from "react";
import { Upload, Cpu, Download, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: <Upload className="h-6 w-6" />,
    title: "Upload Your Image",
    description: "Drag and drop or select your images. We support PNG, JPG, WebP, and more.",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: <Cpu className="h-6 w-6" />,
    title: "Process Your Image",
    description: "Choose from our AI-powered tools like background removal, resizing, or asset generation.",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: "Download Results",
    description: "Get your processed images instantly in high quality. No waiting, no watermarks.",
    color: "bg-green-500/10 text-green-500",
  },
];

export function ProcessSteps() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight mb-4">How it Works</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get professional results in three simple steps, all happening locally in your browser for maximum privacy.
        </p>
      </div>
<div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12">
  {/* Connection Line (Desktop) */}
  <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-30 -z-10" />

  {steps.map((step, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
      className="flex flex-col items-center text-center group relative"
    >
      {/* Mobile Connection Line */}
      {index < steps.length - 1 && (
        <div className="md:hidden absolute top-24 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-current to-transparent opacity-20 -z-10" />
      )}

      <div className={`mb-6 p-4 rounded-2xl ${step.color} transition-transform group-hover:scale-110 shadow-sm border border-current/10 bg-background z-10`}>
        {step.icon}
      </div>

      <div className="relative">
...
              {/* Step Number Badge */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background border text-[10px] font-bold px-2 py-0.5 rounded-full text-muted-foreground">
                STEP 0{index + 1}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                {step.description}
              </p>
            </div>

            {/* Mobile Arrow */}
            {index < steps.length - 1 && (
              <div className="md:hidden my-6 text-muted-foreground/30">
                <ArrowRight className="h-6 w-6 rotate-90" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
