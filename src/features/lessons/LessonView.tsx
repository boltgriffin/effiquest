import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EquationCard } from '@/components/EquationCard';
import { Icon } from '@/components/icons/Icon';
import { MathText } from '@/components/MathText';
import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import type { Lesson, LessonBlock } from '@/content/lessons';
import { getMisconception } from '@/content/misconceptions';
import { labs } from '@/content/quests';
import type { AssessmentItem } from '@/types';

/**
 * Renders a module lesson: intro, contents, then sections of text, tables, equations, worked
 * examples, "common idea" callouts, lab links and practice questions. Practice questions are
 * rendered by the page (`renderCheck`) so this feature does not depend on the assessment feature.
 */
export function LessonView({
  lesson,
  renderCheck,
}: {
  lesson: Lesson;
  renderCheck: (item: AssessmentItem) => ReactNode;
}) {
  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        {lesson.status === 'draft' ? (
          <div>
            <Badge tone="sample">Draft · teacher review</Badge>
          </div>
        ) : null}
        <p className="text-lg leading-relaxed">{lesson.intro}</p>
        <nav aria-label="In this lesson">
          <p className="text-sm font-medium">In this lesson</p>
          <ol className="mt-1 list-decimal pl-5 text-sm">
            {lesson.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#lesson-${s.id}`}
                  className="inline-flex min-h-9 items-center text-brand underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {lesson.sections.map((s, i) => (
        <section
          key={s.id}
          id={`lesson-${s.id}`}
          aria-labelledby={`lesson-${s.id}-h`}
          className="flex scroll-mt-20 flex-col gap-4"
        >
          <div>
            <p className="font-mono text-xs tracking-wide text-muted uppercase">
              Part {i + 1} · {s.source}
            </p>
            <h2 id={`lesson-${s.id}-h`} className="font-display text-2xl">
              {s.title}
            </h2>
          </div>
          {s.pendingCheck ? (
            <Callout tone="warning" title="Awaiting teacher check">
              {s.pendingCheck}
            </Callout>
          ) : null}
          {s.blocks.map((b, j) => (
            <Block key={j} block={b} renderCheck={renderCheck} />
          ))}
        </section>
      ))}
    </article>
  );
}

function Block({
  block,
  renderCheck,
}: {
  block: LessonBlock;
  renderCheck: (item: AssessmentItem) => ReactNode;
}) {
  switch (block.kind) {
    case 'text':
      return (
        <p className="leading-relaxed">
          <MathText text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className="flex list-disc flex-col gap-1 pl-5 leading-relaxed">
          {block.items.map((it) => (
            <li key={it}>
              <MathText text={it} />
            </li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-muted">{block.caption}</caption>
            <thead>
              <tr className="border-b border-rule-strong text-left">
                {block.headers.map((h) => (
                  <th key={h} scope="col" className="py-2 pr-4 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {block.rows.map((r) => (
                <tr key={r.join('|')}>
                  {r.map((c, k) =>
                    k === 0 ? (
                      <th key={k} scope="row" className="py-2 pr-4 text-left font-normal">
                        {c}
                      </th>
                    ) : (
                      <td key={k} className="py-2 pr-4">
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'equation':
      return <EquationCard equation={block.equation} />;
    case 'example':
      return (
        <div className="flex flex-col gap-2 rounded-md border border-rule p-4">
          <p className="font-mono text-xs tracking-wide text-muted uppercase">Worked example</p>
          <h3 className="font-display text-lg">{block.title}</h3>
          <p>
            <MathText text={block.problem} />
          </p>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-[0.95rem]">
            {block.steps.map((st) => (
              <li key={st}>
                <MathText text={st} />
              </li>
            ))}
          </ol>
          <p className="text-sm">
            Answer:{' '}
            <span className="num font-medium">
              {block.answer.value.toLocaleString('en')}
              {block.answer.unit === '%' ? '%' : ` ${block.answer.unit}`}
            </span>
          </p>
        </div>
      );
    case 'idea': {
      const m = getMisconception(block.misconceptionId);
      return (
        <div className="grid grid-cols-1 gap-3 rounded-md border border-rule p-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted uppercase">
              Common idea · {m.id}
            </p>
            <p className="font-display text-lg italic">“{m.belief}”</p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-wide text-muted uppercase">
              What the evidence says
            </p>
            <p>
              <MathText text={block.evidence} />
            </p>
          </div>
        </div>
      );
    }
    case 'lab': {
      const lab = labs.find((l) => l.id === block.labId);
      if (!lab) return null;
      return (
        <Link
          to={lab.to}
          className="flex min-h-11 items-start gap-3 rounded-md border border-brand/40 bg-brand-soft p-4 hover:border-brand"
        >
          <Icon name={lab.icon} className="mt-0.5 shrink-0 text-brand" />
          <span>
            <span className="block font-medium text-brand">Try it in the lab: {lab.title}</span>
            <span className="block text-sm">{block.prompt}</span>
          </span>
        </Link>
      );
    }
    case 'check':
      return <>{renderCheck(block.item)}</>;
  }
}
