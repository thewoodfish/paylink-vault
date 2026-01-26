import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Link2, 
  Receipt, 
  CheckCircle,
  Github,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: Link2,
    title: 'Create PayLink',
    description: 'Merchants generate a payment link with amount, token, and privacy settings.',
  },
  {
    icon: Zap,
    title: 'Instant Payment',
    description: 'Payers open the link and pay privately on Solana with minimal on-chain footprint.',
  },
  {
    icon: Receipt,
    title: 'Selective Receipt',
    description: 'Payers receive a receipt where they control exactly which fields to reveal.',
  },
];

const benefits = [
  {
    title: 'Selective Disclosure',
    description: 'Reveal only the fields you need. Prove payment amount without exposing merchant identity.',
  },
  {
    title: 'On-chain Verification',
    description: 'Cryptographic proofs tied to Solana transactions. Verifiable by anyone, anywhere.',
  },
  {
    title: 'Privacy by Default',
    description: 'No personal data stored. No accounts required. Just payment and proof.',
  },
];

const heliusFeatures = [
  {
    title: 'Real-time Webhooks',
    description: 'Instant payment notifications with Helius webhook infrastructure.',
  },
  {
    title: 'Enhanced Transactions',
    description: 'Rich transaction parsing for detailed payment verification.',
  },
  {
    title: 'Priority Fee API',
    description: 'Dynamic fee estimation for reliable, fast confirmations.',
  },
];

const faqs = [
  {
    question: 'How does selective disclosure work?',
    answer: 'When you receive a receipt, you can generate a cryptographic proof that reveals only specific fields (like amount or timestamp) while keeping others hidden. The proof is mathematically verifiable without exposing the hidden data.',
  },
  {
    question: 'What tokens are supported?',
    answer: 'Currently SOL and USDC are supported out of the box. Custom SPL tokens can be added by providing the mint address when creating a PayLink.',
  },
  {
    question: 'Is this production-ready?',
    answer: 'This is a demo implementation. The UI is fully functional, but backend integration and cryptographic proof generation would need to be implemented for production use.',
  },
  {
    question: 'How are payments verified?',
    answer: 'Payments are verified on-chain using Helius webhooks and enhanced transaction parsing. The receipt system creates a cryptographic commitment that can be verified against the on-chain record.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <Shield className="h-4 w-4" />
              Privacy-first payments on Solana
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Private PayLinks +{' '}
              <span className="gradient-text">Selective Disclosure</span>{' '}
              Receipts
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create payment links. Accept payments privately. Issue receipts where payers 
              control exactly which fields to reveal. Powered by Solana and Helius.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="glow-primary">
                <Link to="/dashboard/paylinks/new">
                  Create a PayLink
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/verify">
                  <Receipt className="mr-2 h-4 w-4" />
                  Verify a Receipt
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How it Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps from payment link to verifiable receipt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative glass-card p-6 text-center group hover:border-primary/50 transition-colors"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Privacy Benefits</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You control what to reveal, not the payment processor
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <CheckCircle className="h-8 w-8 text-success mb-4" />
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Helius features */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[#fe5f00] mb-4">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Powered by Helius</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Infrastructure-Grade Reliability</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built on Helius for instant webhooks, enhanced parsing, and smart fee estimation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {heliusFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-[#fe5f00]/20 bg-[#fe5f00]/5 hover:border-[#fe5f00]/40 transition-colors"
              >
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RP</span>
              </div>
              <span className="font-semibold">Receiptless PayLinks</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/verify" className="hover:text-foreground transition-colors">
                Verify
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Demo implementation. Not for production use.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
