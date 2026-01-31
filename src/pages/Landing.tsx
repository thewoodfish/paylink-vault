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
  Lock,
  DollarSign,
  Layers,
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
    description: 'Generate a payment link with Light Protocol ZK Compression for 99.7% cost savings.',
  },
  {
    icon: Zap,
    title: 'Compressed Payment',
    description: 'Pay with compressed tokens using zero-knowledge proofs. Only 128 bytes on-chain.',
  },
  {
    icon: Receipt,
    title: 'Selective Receipt',
    description: 'Get a cryptographic receipt where you control exactly which fields to reveal.',
  },
];

const benefits = [
  {
    title: 'Selective Disclosure',
    description: 'Reveal only the fields you need. Prove payment amount without exposing merchant identity.',
  },
  {
    title: 'ZK Compression Privacy',
    description: 'Light Protocol stores account state as Merkle tree commitments instead of full data on-chain.',
  },
  {
    title: '99.7% Cost Savings',
    description: 'No rent required for compressed accounts. Constant 128-byte proof for unlimited payments.',
  },
];

const heliusFeatures = [
  {
    title: 'Real-time Webhooks',
    description: 'Instant payment notifications with Helius webhook infrastructure.',
  },
  {
    title: 'Enhanced Transactions',
    description: 'Rich transaction parsing for compressed token detection and verification.',
  },
  {
    title: 'Priority Fee API',
    description: 'Dynamic fee estimation for reliable, fast confirmations.',
  },
];

const lightProtocolFeatures = [
  {
    icon: Lock,
    title: 'Zero-Knowledge Proofs',
    description: 'Account state stored as Merkle tree commitments. Privacy built into the protocol.',
    stat: 'ZK Proof',
  },
  {
    icon: DollarSign,
    title: 'No Rent Required',
    description: 'Compressed accounts eliminate storage costs. Pay once, use forever.',
    stat: '99.7% Savings',
  },
  {
    icon: Layers,
    title: 'L1 Composability',
    description: 'Full compatibility with Solana programs. Audited security guarantees.',
    stat: '128 Bytes',
  },
];

const faqs = [
  {
    question: 'What is Light Protocol ZK Compression?',
    answer: 'Light Protocol uses zero-knowledge proofs to compress Solana account data into Merkle tree commitments. Instead of storing full account state on-chain (which requires rent), only cryptographic hashes are stored. This reduces costs by 99.7% while maintaining L1 security and composability.',
  },
  {
    question: 'How does selective disclosure work?',
    answer: 'When you receive a receipt, you can generate a cryptographic proof (SHA256 commitment + nonce) that reveals only specific fields like amount or timestamp while keeping others hidden. The proof is mathematically verifiable without exposing the concealed data.',
  },
  {
    question: 'What are the cost savings?',
    answer: 'Regular SPL token accounts require ~0.002 SOL rent per account. Light Protocol compressed accounts require only ~0.000005 SOL for a constant 128-byte validity proof. For 1,000 payments, you save ~$199.50 (99.7% reduction).',
  },
  {
    question: 'How are compressed payments verified?',
    answer: 'Helius webhooks detect compressed token transactions. Our backend verifies the zero-knowledge validity proof (done on-chain by Light Protocol), matches the payment against PayLink requirements, and issues a cryptographic receipt with selective disclosure.',
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
              Powered by Light Protocol ZK Compression
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Privacy PayLinks with{' '}
              <span className="gradient-text">99.7% Cost Savings</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create payment links with Light Protocol ZK compression. Accept payments privately
              with zero-knowledge proofs. Issue receipts with selective disclosure.
              Built on Solana with Helius infrastructure.
            </p>

            <div className="flex items-center justify-center gap-8 mb-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">No rent required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">128-byte proofs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Full L1 security</span>
              </div>
            </div>

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

      {/* Light Protocol features */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Powered by Light Protocol</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">ZK Compression for Privacy + Savings</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Zero-knowledge proofs compress Solana account data into Merkle tree commitments,
              reducing costs by 99.7% while enhancing privacy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {lightProtocolFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-mono bg-primary/10 px-2 py-1 rounded">
                    {feature.stat}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Helius features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[#fe5f00] mb-4">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Powered by Helius</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Infrastructure-Grade Reliability</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built on Helius for instant webhooks, compressed token detection, and smart fee estimation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {heliusFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-[#fe5f00]/20 bg-card hover:border-[#fe5f00]/40 transition-colors"
              >
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border">
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
              Built with Light Protocol, Helius, and Solana
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
