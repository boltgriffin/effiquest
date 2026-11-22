import { useNavigate } from 'react-router-dom';
import { BrandName } from '@/app/BrandMark';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { eyebrowClass } from '@/components/ui/styles';
import { InclineDiagram } from '@/features/lab/InclineDiagram';
import { useUiStore } from '@/store/uiStore';

const method: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'target',
    title: 'Predict',
    text: 'Commit to what you think a machine will do before you test it.',
  },
  {
    icon: 'gauge',
    title: 'Measure',
    text: 'Read forces and distances, then calculate work and efficiency yourself.',
  },
  {
    icon: 'journal',
    title: 'Explain',
    text: 'Compare the result with your prediction and record what changed in your thinking.',
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const setSeenWelcome = useUiStore((s) => s.setSeenWelcome);

  const enter = () => {
    setSeenWelcome(true);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <BrandName />
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="grid grid-cols-1 items-center gap-10 border-b border-rule py-10 lg:grid-cols-[1.05fr_1fr] lg:py-16">
          <div>
            <p className={eyebrowClass}>Grade 11 General Science · Machines and efficiency</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Find out where the energy goes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              A laboratory for testing your ideas about levers, ramps, pulleys and hydraulics. A
              machine can make a job easier and still waste energy. Here you measure how much.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" iconRight="arrowRight" onClick={enter}>
                Enter the laboratory
              </Button>
              <a
                href="#method"
                className="inline-flex min-h-11 items-center px-2 font-medium text-brand underline-offset-4 hover:underline"
              >
                How a lab session works
              </a>
            </div>
          </div>
          <figure className="paper-grid overflow-hidden rounded-md border border-rule">
            <InclineDiagram angleDeg={28} friction={0.3} massKg={10} className="w-full" />
            <figcaption className="flex flex-wrap gap-x-5 gap-y-1 border-t border-rule bg-surface px-4 py-2.5 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-input" /> effort (input)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-output" /> load (output)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-loss" /> friction (loss)
              </span>
            </figcaption>
          </figure>
        </section>

        <section id="method" aria-labelledby="method-title" className="scroll-mt-6 py-10">
          <h2 id="method-title" className="font-display text-2xl">
            How a lab session works
          </h2>
          <ol className="mt-6 grid gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-3">
            {method.map((m, i) => (
              <li key={m.title} className="flex gap-4 bg-surface p-5">
                <span className="num text-sm text-muted">0{i + 1}</span>
                <div>
                  <h3 className="flex items-center gap-2 font-medium">
                    <Icon name={m.icon} size={18} className="text-brand" />
                    {m.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <Icon name="offline" size={16} />
            Works offline after the first visit. Your work stays on this device.
          </p>
        </section>
      </main>
    </div>
  );
}
