'use client';

type Step = 'shipping' | 'payment' | 'confirm';

const STEPS = ['shipping', 'payment', 'confirm'] as const;

const STEP_LABELS: Record<Step, string> = {
  shipping: 'Envío',
  payment: 'Pago',
  confirm: 'Confirmación',
};

export default function CheckoutStepper({ step }: { step: Step }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              step === s
                ? 'bg-primary text-on-primary'
                : ['shipping', 'payment'].indexOf(step) >= i
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`hidden sm:inline font-body text-sm ${
              step === s ? 'text-on-surface font-medium' : 'text-on-surface-variant'
            }`}
          >
            {STEP_LABELS[s]}
          </span>
          {i < 2 && <div className="h-px w-8 bg-outline-variant hidden sm:block" />}
        </div>
      ))}
    </div>
  );
}
