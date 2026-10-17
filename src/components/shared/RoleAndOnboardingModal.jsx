import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';
import { switchActiveMode } from '@/lib/api-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Package, Car, ArrowRight, Sparkles, LoaderCircle } from 'lucide-react';

/**
 * FirstTimeModeDialog
 * First-time signup modal using @radix-ui/react-dialog asking:
 * "How would you like to get started?" with options "Customer Mode" and "Driver Mode",
 * calling /api/auth/mode on confirmation and routing accordingly.
 */
export function FirstTimeModeDialog({
  open,
  onOpenChange,
  onSelectMode,
  initialMode = 'customer',
}) {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(initialMode || 'customer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setSelectedMode(initialMode === 'rider' ? 'rider' : 'customer');
    }
  }, [initialMode]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (onSelectMode) {
        await onSelectMode(selectedMode);
      } else {
        await switchActiveMode(selectedMode);
        toast.success(`Welcome to SWIFTY! Active mode: ${selectedMode === 'rider' ? 'Driver' : 'Customer'}`);
        navigate(selectedMode === 'rider' ? '/rider' : '/customer');
      }
      onOpenChange?.(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to set initial mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card text-card-foreground border-border shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-500">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Shared Role Account</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            How would you like to get started?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Your SWIFTY account has both Customer and Driver capabilities built in. Pick how you&apos;d like to begin—you can switch between modes anytime from your account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
          {/* Customer Mode Option */}
          <button
            type="button"
            onClick={() => setSelectedMode('customer')}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              selectedMode === 'customer'
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/25 shadow-sm'
                : 'border-border bg-secondary/30 hover:border-slate-500/40'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 mb-3">
              <Package className="h-5 w-5" />
            </div>
            <div className="font-bold text-sm text-foreground">Customer Mode</div>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Book rides, send packages, and track deliveries in real time.
            </p>
          </button>

          {/* Driver Mode Option */}
          <button
            type="button"
            onClick={() => setSelectedMode('rider')}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              selectedMode === 'rider'
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/25 shadow-sm'
                : 'border-border bg-secondary/30 hover:border-slate-500/40'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 mb-3">
              <Car className="h-5 w-5" />
            </div>
            <div className="font-bold text-sm text-foreground">Driver Mode</div>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Accept delivery requests, manage trips, and earn on every job.
            </p>
          </button>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Configuring mode...</span>
              </>
            ) : (
              <>
                <span>Continue as {selectedMode === 'rider' ? 'Driver' : 'Customer'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Backward compatibility alias
 */
export function FirstTimeOnboardingModal({ isOpen, onClose, onComplete, initialMode = 'customer' }) {
  return (
    <FirstTimeModeDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
      initialMode={initialMode}
      onSelectMode={async (mode) => {
        await onComplete?.({ mode });
      }}
    />
  );
}

/**
 * RoleModeSwitchCard
 * Component placed on Customer and Driver account views to switch activeMode.
 * Redirects guests to /auth?mode=rider&view=login.
 */
export function RoleModeSwitchCard({ currentMode = 'customer', isGuest = false, onSwitchMode }) {
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const targetMode = currentMode === 'rider' ? 'customer' : 'rider';

  const handleSwitch = async () => {
    const guestCheck =
      isGuest ||
      sessionStorage.getItem('is_guest_session') === 'true' ||
      localStorage.getItem('user_role') === 'guest';

    if (guestCheck) {
      sessionStorage.removeItem('is_guest_session');
      navigate('/auth?mode=rider&view=login');
      return;
    }

    try {
      setSwitching(true);
      if (onSwitchMode) {
        await onSwitchMode(targetMode);
      } else {
        await switchActiveMode(targetMode);
        toast.success(`Switched to ${targetMode === 'rider' ? 'Driver' : 'Customer'} Mode`);
        navigate(targetMode === 'rider' ? '/rider' : '/customer');
      }
    } catch (err) {
      toast.error(err?.message || `Failed to switch to ${targetMode === 'rider' ? 'Driver' : 'Customer'} Mode`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="my-4 rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-foreground">
            Active Mode: {currentMode === 'rider' ? 'Driver / Courier' : 'Customer'}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
            {isGuest ? 'Guest Session' : 'Shared Role Account'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isGuest
            ? 'Driver mode is not available in Guest mode. Sign in to your account to accept orders as a driver.'
            : `Switch your active workspace to ${targetMode === 'rider' ? 'Driver Mode to receive & process orders' : 'Customer Mode to book rides & deliveries'}.`}
        </p>
      </div>
      <button
        type="button"
        disabled={switching}
        onClick={handleSwitch}
        className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
      >
        {switching && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
        {switching
          ? 'Switching...'
          : isGuest
          ? 'Login as Driver →'
          : `Switch to ${targetMode === 'rider' ? 'Driver Mode' : 'Customer Mode'}`}
      </button>
    </div>
  );
}

export function ForgotPasswordModal({ isOpen, onClose, apiBaseUrl = '/api/auth' }) {
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not send reset code');
      if (data.devResetCode) setDevCodeHint(data.devResetCode);
      if (data.resetUrl) setDevCodeHint(data.resetUrl);
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Failed to initiate password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code, code, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Invalid or expired reset code');
      setStep('done');
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {step === 'request' && 'Reset Your Password'}
            {step === 'reset' && 'Enter Recovery Code'}
            {step === 'done' && 'Password Updated!'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Enter the email address associated with your account and we will send a 6-digit recovery code.
            </p>
            <div>
              <label className="block text-xs font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm"
            >
              {loading ? 'Sending Code...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {devCodeHint && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                Dev Recovery Code: <strong>{devCodeHint}</strong>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1">6-Digit Recovery Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm tracking-widest"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm"
            >
              {loading ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center py-2">
            <p className="text-sm text-emerald-400 font-medium">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
