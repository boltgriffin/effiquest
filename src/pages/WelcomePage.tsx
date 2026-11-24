import { useNavigate } from 'react-router-dom';
import { BrandMark } from '@/app/BrandMark';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { buttonClass, eyebrowClass } from '@/components/ui/styles';
import { SimulationShowcase } from '@/features/lab/showcase/SimulationShowcase';
import { useUiStore } from '@/store/uiStore';
import { cx } from '@/utils/cx';
import { WelcomeNav } from './welcome/WelcomeNav';

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

const facts: Array<{ icon: IconName; text: string }> = [
  { icon: 'layers', text: 'Nine machines, simple to compound' },
  { icon: 'gauge', text: 'Efficiency measured, never assumed' },
  { icon: 'offline', text: 'Works offline' },
];

/**
 * First screen (always in the dark theme): navigation, hero, the 3D simulation showcase and how a
 * lab session works. Leaving it marks the welcome as seen, so the dashboard opens next time.
 */
export default function WelcomePage() {
  const navigate = useNavigate();
  const setSeenWelcome = useUiStore((s) => s.setSeenWelcome);

  const go = (to: string) => {
    setSeenWelcome(true);
    navigate(to, { replace: to === '/' });
  };

  return (
    <div className="theme-dark min-h-dvh overflow-x-clip bg-bg text-ink">
      <WelcomeNav onEnter={() => go('/')} onNavigate={go} />

      <main>
        <section id="top" className="relative isolate scroll-mt-16 overflow-hidden">
          <div aria-hidden="true" className="welcome-aurora absolute inset-0 -z-10" />
          <div aria-hidden="true" className="welcome-grid absolute inset-0 -z-10" />
          <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:pt-20">
            <p className={cx(eyebrowClass, 'flex items-center gap-2 text-brand')}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
              EffiQuest 3D · Grade 11 General Science
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Explore. Experiment. <span className="text-brand">Understand.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted sm:text-xl">
              Discover the science behind everyday machines through immersive 3D simulations and
              interactive experiments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#simulations" className={buttonClass('primary')}>
                Explore simulations
                <Icon name="chevronDown" size={18} />
              </a>
              <a href="#about" className={buttonClass('secondary')}>
                Discover EffiQuest
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {facts.map((f) => (
                <li key={f.text} className="flex items-center gap-2">
                  <Icon name={f.icon} size={16} className="text-brand" />
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="simulations"
          aria-labelledby="simulations-title"
          className="mx-auto max-w-7xl scroll-mt-16 px-4 py-10 sm:px-6"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={eyebrowClass}>The laboratory</p>
              <h2 id="simulations-title" className="mt-2 font-display text-3xl sm:text-4xl">
                Choose a simulation
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted">
              The same 3D machines you use in each lab. Tap one on the track, swipe, or use the
              arrow keys to see what it teaches, then open the experiment.
            </p>
          </div>
          <SimulationShowcase onExplore={go} />
        </section>

        <section
          id="about"
          aria-labelledby="about-title"
          className="mx-auto max-w-7xl scroll-mt-16 px-4 py-14 sm:px-6"
        >
          <div className="grid grid-cols-1 gap-10 border-t border-rule pt-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className={eyebrowClass}>Discover EffiQuest</p>
              <h2 id="about-title" className="mt-2 font-display text-3xl sm:text-4xl">
                Find out where the energy goes.
              </h2>
              <p className="mt-4 text-muted">
                A laboratory for testing your ideas about levers, ramps, pulleys and hydraulics. A
                machine can make a job easier and still waste energy. Here you measure how much.
              </p>
              <Button
                variant="primary"
                iconRight="arrowRight"
                onClick={() => go('/')}
                className="mt-6"
              >
                Enter the laboratory
              </Button>
            </div>
            <div>
              <h3 className="font-display text-xl">How a lab session works</h3>
              <ol className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-3">
                {method.map((m, i) => (
                  <li key={m.title} className="flex flex-col gap-2 bg-surface p-5">
                    <span className="num text-sm text-muted">0{i + 1}</span>
                    <span className="flex items-center gap-2 font-medium">
                      <Icon name={m.icon} size={18} className="text-brand" />
                      {m.title}
                    </span>
                    <p className="text-sm text-muted">{m.text}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted">
                <Icon name="offline" size={16} />
                Works offline after the first visit. Your work stays on this device.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <BrandMark size={24} />
          <span>EffiQuest 3D · Machine and efficiency laboratory · Grade 11 General Science</span>
        </div>
      </footer>
    </div>
  );
}
