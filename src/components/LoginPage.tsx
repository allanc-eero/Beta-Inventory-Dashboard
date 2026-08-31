'use client';

import { useState } from 'react';
import { Button, Input, Segmented, ProgressBar } from '@amzn/eero-web-design-components';
import { useAuthStore } from '@/store/authStore';
import { Wifi } from 'lucide-react';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneOS: string;
  hasEeroNetwork: string;
  networkEmail: string;
  testGroup: string;
  streetAddress: string;
  aptUnit: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  sqFeet: string;
  preferWorkAddress: boolean;
  workStreet: string;
  workFloor: string;
  workCity: string;
  workState: string;
  workZip: string;
  productionEmail: string;
}

const INITIAL_DATA: RegistrationData = {
  firstName: '', lastName: '', email: '',
  phoneOS: '', hasEeroNetwork: '', networkEmail: '', testGroup: '',
  streetAddress: '', aptUnit: '', city: '', state: '', zipCode: '',
  phoneNumber: '', sqFeet: '', preferWorkAddress: false,
  workStreet: '', workFloor: '', workCity: '', workState: '', workZip: '',
  productionEmail: '',
};

export default function LoginPage() {
  const { login, register } = useAuthStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>(INITIAL_DATA);
  const [registering, setRegistering] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(email);
    if (!result.success) setError(result.error || 'Login failed');
  };

  const updateField = (field: keyof RegistrationData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterSubmit = () => {
    setRegistering(true);
    setError('');
    const name = `${formData.firstName} ${formData.lastName}`.trim();
    const profile = {
      phoneOS: formData.phoneOS,
      hasEeroNetwork: formData.hasEeroNetwork,
      networkEmail: formData.networkEmail,
      testGroup: formData.testGroup,
      streetAddress: formData.streetAddress,
      aptUnit: formData.aptUnit,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      phoneNumber: formData.phoneNumber,
      sqFeet: formData.sqFeet,
      preferWorkAddress: formData.preferWorkAddress,
      workStreet: formData.workStreet,
      workFloor: formData.workFloor,
      workCity: formData.workCity,
      workState: formData.workState,
      workZip: formData.workZip,
      productionEmail: formData.productionEmail,
    };
    const result = register(formData.email, name, profile);
    if (!result.success) {
      setError(result.error || 'Registration failed');
      setRegistering(false);
    }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Please fill in all fields.');
        return;
      }
      if (!formData.email.endsWith('@eero.com')) {
        setError('Only @eero.com emails can register.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.phoneOS || !formData.hasEeroNetwork || !formData.testGroup) {
        setError('Please answer all questions.');
        return;
      }
    }
    if (step === 3) {
      if (!formData.streetAddress || !formData.city || !formData.state || !formData.zipCode) {
        setError('Please fill in your shipping address.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => { setError(''); setStep((s) => s - 1); };

  const ErrorBox = ({ children }: { children: React.ReactNode }) => (
    <div className="p-3 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-lg">
      <p className="text-xs text-[var(--ui-support-text-support-error)]">{children}</p>
    </div>
  );

  // ─── LOGIN VIEW ─────────────────────────────────────────────────────────────
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-[var(--ui-background-layer-background-page)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-md border border-[var(--ui-background-layer-border-border-layer-page)] p-8">
            <div className="text-center mb-8">
              <Wifi size={48} className="mx-auto text-[var(--ui-core-periwinkle-periwinkle-6)] mb-4" strokeWidth={1.5} />
              <h1 className="text-2xl font-bold text-[var(--ui-text-text-primary)]">eero Fetch</h1>
              <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-2">Sign in with your @eero.com email</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                id="login-email"
                label="Email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@eero.com"
                layout="vertical"
                autoFocus
              />
              {error && <ErrorBox>{error}</ErrorBox>}
              <Button type="primary" label="Sign In" fullWidth onClick={() => handleLogin({ preventDefault: () => {} } as React.FormEvent)} />
            </form>
            <div className="mt-6 pt-4 border-t border-[var(--ui-background-layer-border-border-layer-page)] text-center">
              <p className="text-xs text-[var(--ui-text-text-tertiary)]">
                Dogfooder?{' '}
                <button onClick={() => { setMode('register'); setError(''); setStep(1); setFormData(INITIAL_DATA); }} className="text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] font-medium">
                  Register here →
                </button>
              </p>
            </div>
            <p className="text-xs text-[var(--ui-text-text-placeholder)] text-center mt-4">Only @eero.com accounts can access this tool.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── REGISTRATION VIEW (Multi-step) ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--ui-background-layer-background-page)] flex items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-md border border-[var(--ui-background-layer-border-border-layer-page)] p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Wifi size={36} className="mx-auto text-[var(--ui-core-periwinkle-periwinkle-6)] mb-3" strokeWidth={1.5} />
            <h1 className="text-xl font-bold text-[var(--ui-text-text-primary)]">eero Fetch — Dogfood Registration</h1>
            <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">Step {step} of 4</p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <ProgressBar label={`Step ${step} of 4`} percent={step * 25} />
          </div>

          {error && <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>}

          {/* Step 1: Name + Email */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--ui-text-text-secondary)]">Your Info</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input id="reg-first-name" label="First Name" value={formData.firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('firstName', e.target.value)} placeholder="Josh" layout="vertical" />
                <Input id="reg-last-name" label="Last Name" value={formData.lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('lastName', e.target.value)} placeholder="Thornbrugh" layout="vertical" />
              </div>
              <Input id="reg-email" label="eero Email" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('email', e.target.value)} placeholder="you@eero.com" layout="vertical" />
            </div>
          )}

          {/* Step 2: Device & Network Preferences */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--ui-text-text-secondary)]">Device & Network</h2>
              <div>
                <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Phone OS</label>
                <Segmented
                  items={[{ label: 'iOS', value: 'iOS' }, { label: 'Android', value: 'Android' }]}
                  value={formData.phoneOS}
                  onChange={(val) => updateField('phoneOS', val as string)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Do you have an eero network?</label>
                <Segmented
                  items={[{ label: 'No', value: 'No' }, { label: 'Yes', value: 'Yes' }, { label: 'Yes, multiple', value: 'Yes, multiple' }]}
                  value={formData.hasEeroNetwork}
                  onChange={(val) => updateField('hasEeroNetwork', val as string)}
                />
              </div>
              {(formData.hasEeroNetwork === 'Yes' || formData.hasEeroNetwork === 'Yes, multiple') && (
                <Input id="reg-network-email" label="Network email (if applicable)" value={formData.networkEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('networkEmail', e.target.value)} placeholder="personal@gmail.com" layout="vertical" />
              )}
              <div>
                <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Test group preference</label>
                <Segmented
                  items={[
                    { label: '🚀 Latest & greatest', value: 'Latest and greatest firmware' },
                    { label: '🛡️ More mature', value: 'More mature firmware' },
                  ]}
                  value={formData.testGroup}
                  onChange={(val) => updateField('testGroup', val as string)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Shipping Address */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--ui-text-text-secondary)]">Shipping Address</h2>
              <Input id="reg-street" label="Street Address" value={formData.streetAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('streetAddress', e.target.value)} placeholder="123 Main St" layout="vertical" />
              <Input id="reg-apt" label="Apt / Unit Number (optional)" value={formData.aptUnit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('aptUnit', e.target.value)} placeholder="Apt 4B" layout="vertical" />
              <div className="grid grid-cols-3 gap-3">
                <Input id="reg-city" label="City" value={formData.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('city', e.target.value)} placeholder="Seattle" layout="vertical" />
                <Input id="reg-state" label="State" value={formData.state} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('state', e.target.value)} placeholder="WA" layout="vertical" />
                <Input id="reg-zip" label="Zip Code" value={formData.zipCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('zipCode', e.target.value)} placeholder="98101" layout="vertical" />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.preferWorkAddress} onChange={(e) => updateField('preferWorkAddress', e.target.checked)} className="rounded border-[var(--ui-input-border-input-rest)]" />
                  <span className="text-sm text-[var(--ui-text-text-secondary)]">Prefer shipping to a work address?</span>
                </label>
              </div>
              {formData.preferWorkAddress && (
                <div className="pl-4 border-l-2 border-[var(--ui-core-periwinkle-periwinkle-3)] space-y-3">
                  <Input id="reg-work-street" label="Work Street" value={formData.workStreet} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('workStreet', e.target.value)} placeholder="660 3rd St" layout="vertical" />
                  <Input id="reg-work-floor" label="Floor / Suite (optional)" value={formData.workFloor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('workFloor', e.target.value)} placeholder="4th Floor" layout="vertical" />
                  <div className="grid grid-cols-3 gap-3">
                    <Input id="reg-work-city" label="City" value={formData.workCity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('workCity', e.target.value)} layout="vertical" />
                    <Input id="reg-work-state" label="State" value={formData.workState} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('workState', e.target.value)} layout="vertical" />
                    <Input id="reg-work-zip" label="Zip" value={formData.workZip} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('workZip', e.target.value)} layout="vertical" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Contact & Final Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--ui-text-text-secondary)]">Contact & Final Details</h2>
              <Input id="reg-phone" label="Phone Number (incl. country code)" value={formData.phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('phoneNumber', e.target.value)} placeholder="+1 555-123-4567" layout="vertical" />
              <Input id="reg-prod-email" label="Email used for production eero account (personal email)" value={formData.productionEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('productionEmail', e.target.value)} placeholder="personal@gmail.com" layout="vertical" />
              <div>
                <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Approximate sq. footage of home</label>
                <Segmented
                  items={[
                    { label: 'Less than 500', value: 'Less than 500' },
                    { label: '501-1000', value: '501-1000' },
                    { label: '1000-2000', value: '1000-2000' },
                    { label: 'Over 2000', value: 'Over 2000' },
                  ]}
                  value={formData.sqFeet}
                  onChange={(val) => updateField('sqFeet', val as string)}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <Button type="text" label="← Back" onClick={prevStep} />
            ) : (
              <Button type="text" label="← Sign in" onClick={() => { setMode('login'); setError(''); }} />
            )}

            {step < 4 ? (
              <Button type="primary" label="Next →" onClick={nextStep} />
            ) : (
              <Button type="primary" label="Create Account" onClick={handleRegisterSubmit} loading={registering} disabled={registering} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
