import {
  setPendingPickup,
  setPendingDropoff,
  getPendingAddresses,
  clearPendingAddresses,
  saveRouteDraft,
  getRouteDraft,
} from './api-store';
import { resolveAddressCoords } from './address-suggestions';

// Automatically syncs pickup/dropoff inputs to store & sessionStorage
if (typeof window !== 'undefined') {
  window.addEventListener(
    'input',
    (e) => {
      const el = e.target;
      if (!el || el.tagName !== 'INPUT') return;
      const placeholder = (el.placeholder || '').toLowerCase();
      const name = (el.name || el.id || '').toLowerCase();
      const value = el.value?.trim() || '';

      if (
        placeholder.includes('pickup') ||
        placeholder.includes('pick up') ||
        placeholder.includes('from') ||
        name.includes('pickup')
      ) {
        const coords = resolveAddressCoords(value, null);
        setPendingPickup({ text: el.value, coords });
        saveRouteDraft({ pickup: { address: el.value, ...(coords || {}) } });
      } else if (
        placeholder.includes('dropoff') ||
        placeholder.includes('drop off') ||
        placeholder.includes('destination') ||
        placeholder.includes('where to') ||
        placeholder.includes('to') ||
        name.includes('dropoff') ||
        name.includes('destination')
      ) {
        const coords = resolveAddressCoords(value, null);
        setPendingDropoff({ text: el.value, coords });
        saveRouteDraft({ dropoff: { address: el.value, ...(coords || {}) } });
      }
    },
    true
  );
}

export function hydrateRideInputsFromDraft() {
  const pending = getPendingAddresses();
  const draft = getRouteDraft();
  return {
    pickup: pending.pickup?.text || draft.pickup?.address || (typeof draft.pickup === 'string' ? draft.pickup : '') || '',
    pickupCoords: pending.pickup?.coords || (draft.pickup?.lat ? { lat: draft.pickup.lat, lng: draft.pickup.lng } : null),
    dropoff: pending.dropoff?.text || draft.dropoff?.address || (typeof draft.dropoff === 'string' ? draft.dropoff : '') || '',
    dropoffCoords: pending.dropoff?.coords || (draft.dropoff?.lat ? { lat: draft.dropoff.lat, lng: draft.dropoff.lng } : null),
  };
}

export { getPendingAddresses, clearPendingAddresses, setPendingPickup, setPendingDropoff };
