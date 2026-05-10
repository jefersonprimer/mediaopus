import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is it really free to use?",
    answer:
      "Yes, ImageToolkit is completely free. We don't have hidden fees, subscriptions, or watermarks on your downloaded images.",
  },
  {
    question: "Are my images uploaded to any server?",
    answer:
      "Absolutely not. All processing happens locally in your browser. Your images never leave your computer, ensuring 100% privacy and security.",
  },
  {
    question: "What image formats are supported?",
    answer:
      "We support all common web formats including PNG, JPEG, WebP, and AVIF. You can also export your processed images in these formats.",
  },
  {
    question: "Does the background removal work on complex images?",
    answer:
      "Yes, our AI model is trained to handle complex backgrounds, hair, and fine details. For best results, ensure the subject is well-defined.",
  },
  {
    question: "Can I use the assets for commercial projects?",
    answer:
      "Yes! Any image you process or asset you generate with MediaOpus can be used for both personal and commercial projects without any attribution required.",
  },
];

export function FAQ() {
  return (
    <section className="w-full py-16 md:py-24 border-t border-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about ImageToolkit.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b-muted/20"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary transition-colors py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
