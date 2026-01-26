import { useState, useEffect } from 'react';
import { Save, Globe, Palette, Webhook, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Identicon } from '@/components/ui/Identicon';
import { getMerchantSettings, setMerchantSettings } from '@/lib/merchant';
import type { MerchantSettings } from '@/lib/types';
import { toast } from 'sonner';

const accentColors = [
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
];

export default function Settings() {
  const [settings, setSettings] = useState<MerchantSettings>(getMerchantSettings());
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setMerchantSettings(settings);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved');
    }, 500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Merchant Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Merchant Identity
          </CardTitle>
          <CardDescription>
            Your public identity for PayLinks and receipts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pubkey">Public Key</Label>
            <div className="flex gap-3">
              {settings.pubkey && (
                <Identicon value={settings.pubkey} size={40} />
              )}
              <Input
                id="pubkey"
                placeholder="Enter your Solana public key..."
                value={settings.pubkey}
                onChange={(e) => setSettings({ ...settings, pubkey: e.target.value })}
                className="font-mono text-sm flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This is stored locally and used for demo purposes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="My Business"
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Shown to payers on the checkout page
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Environment
          </CardTitle>
          <CardDescription>
            Switch between Devnet and Mainnet (UI only in demo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.environment}
            onValueChange={(v) => setSettings({ ...settings, environment: v as 'devnet' | 'mainnet' })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="devnet">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  Devnet
                </span>
              </SelectItem>
              <SelectItem value="mainnet">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Mainnet
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize the look of your PayLink pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSettings({ ...settings, accentColor: color.value })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    settings.accentColor === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Configure webhooks for payment notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL</Label>
            <Input
              id="webhook"
              placeholder="https://your-server.com/webhook"
              value={settings.webhookUrl || ''}
              onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Coming soon. Helius webhooks will be configured automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="glow-primary">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
