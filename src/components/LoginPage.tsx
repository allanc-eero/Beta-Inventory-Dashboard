'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Wifi, ArrowLeft, ArrowRight, Check } from 'lucide-react';

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

  // ─── LOGIN VIEW ─────────────────────────────────────────────────────────────
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <Wifi size={48} className="mx-auto text-[#2c3e7a] mb-4" strokeWidth={1.5} />
              <h1 className="text-2xl font-bold text-gray-900">eero Fetch</h1>
              <p className="text-sm text-gray-500 mt-2">Sign in with your @eero.com email</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@eero.com" className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-700">{error}</p></div>}
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Sign In</button>
            </form>
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">Dogfooder? <button onClick={() => { setMode('register'); setError(''); setStep(1); setFormData(INITIAL_DATA); }} className="text-blue-600 hover:text-blue-800 font-medium">Register here →</button></p>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">Only @eero.com accounts can access this tool.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── REGISTRATION VIEW (Multi-step) ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Wifi size={36} className="mx-auto text-[#2c3e7a] mb-3" strokeWidth={1.5} />
            <h1 className="text-xl font-bold text-gray-900">eero Fetch — Dogfood Registration</h1>
            <p className="text-sm text-gray-500 mt-1">Step {step} of 4</p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-700">{error}</p></div>}

          {/* Step 1: Name + Email */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Your Info</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  <input type="text" value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Josh" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input type="text" value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Thornbrugh" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">eero Email</label>
                <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@eero.com" />
              </div>
            </div>
          )}

          {/* Step 2: Device & Network Preferences */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Device & Network</h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone OS</label>
                <div className="flex gap-3">
                  {['iOS', 'Android'].map((os) => (
                    <button key={os} type="button" onClick={() => updateField('phoneOS', os)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${formData.phoneOS === os ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{os}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Do you have an eero network?</label>
                <div className="flex gap-2">
                  {['No', 'Yes', 'Yes, multiple'].map((opt) => (
                    <button key={opt} type="button" onClick={() => updateField('hasEeroNetwork', opt)} className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-colors ${formData.hasEeroNetwork === opt ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{opt}</button>
                  ))}
                </div>
              </div>
              {(formData.hasEeroNetwork === 'Yes' || formData.hasEeroNetwork === 'Yes, multiple') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Network email (if applicable)</label>
                  <input type="email" value={formData.networkEmail} onChange={(e) => updateField('networkEmail', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="personal@gmail.com" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Test group preference</label>
                <div className="flex gap-2">
                  {['Latest and greatest firmware', 'More mature firmware'].map((opt) => (
                    <button key={opt} type="button" onClick={() => updateField('testGroup', opt)} className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium border transition-colors ${formData.testGroup === opt ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{opt === 'Latest and greatest firmware' ? '🚀 Latest & greatest' : '🛡️ More mature'}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Shipping Address */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Shipping Address</h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
                <input type="text" value={formData.streetAddress} onChange={(e) => updateField('streetAddress', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main St" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apt / Unit Number (optional)</label>
                <input type="text" value={formData.aptUnit} onChange={(e) => updateField('aptUnit', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Apt 4B" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => updateField('city', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Seattle" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input type="text" value={formData.state} onChange={(e) => updateField('state', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="WA" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Zip Code</label>
                  <input type="text" value={formData.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="98101" />
                </div>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.preferWorkAddress} onChange={(e) => updateField('preferWorkAddress', e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Prefer shipping to a work address?</span>
                </label>
              </div>
              {formData.preferWorkAddress && (
                <div className="pl-4 border-l-2 border-blue-200 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Work Street</label>
                    <input type="text" value={formData.workStreet} onChange={(e) => updateField('workStreet', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="660 3rd St" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Floor / Suite (optional)</label>
                    <input type="text" value={formData.workFloor} onChange={(e) => updateField('workFloor', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="4th Floor" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                      <input type="text" value={formData.workCity} onChange={(e) => updateField('workCity', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                      <input type="text" value={formData.workState} onChange={(e) => updateField('workState', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Zip</label>
                      <input type="text" value={formData.workZip} onChange={(e) => updateField('workZip', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Contact & Final Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Contact & Final Details</h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number (incl. country code)</label>
                <input type="tel" value={formData.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 555-123-4567" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email used for production eero account (personal email)</label>
                <input type="email" value={formData.productionEmail} onChange={(e) => updateField('productionEmail', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="personal@gmail.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Approximate sq. footage of home</label>
                <div className="flex gap-2 flex-wrap">
                  {['Less than 500', '501-1000', '1000-2000', 'Over 2000'].map((opt) => (
                    <button key={opt} type="button" onClick={() => updateField('sqFeet', opt)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${formData.sqFeet === opt ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"><ArrowLeft size={16} /> Back</button>
            ) : (
              <button onClick={() => { setMode('login'); setError(''); }} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"><ArrowLeft size={16} /> Sign in</button>
            )}

            {step < 4 ? (
              <button onClick={nextStep} className="flex items-center gap-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Next <ArrowRight size={16} /></button>
            ) : (
              <button onClick={handleRegisterSubmit} disabled={registering} className="flex items-center gap-1 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"><Check size={16} /> Create Account</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
