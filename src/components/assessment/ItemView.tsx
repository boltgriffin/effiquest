import { useId } from 'react';
import { Icon } from '@/components/icons/Icon';
import { TextArea, TextField } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import type {
  AssessmentItem,
  ItemResponse,
  MatchingItem,
  McqItem,
  NumericItem,
  ReflectionItem,
  TrueFalseItem,
} from '@/types';
import { cx } from '@/utils/cx';

/**
 * One assessment item of any kind: multiple choice, true/false, matching, numeric or reflection.
 * Pure UI: it shows the item and reports the learner's answer; marking lives in the assessment
 * feature. `showAnswer` marks the correct choice (after submission or after the last try).
 */
export interface ItemViewProps {
  item: AssessmentItem;
  response: ItemResponse | undefined;
  onChange: (response: ItemResponse) => void;
  disabled?: boolean;
  showAnswer?: boolean;
  /** Message for an unreadable numeric answer. */
  inputError?: string | undefined;
}

export function ItemView(props: ItemViewProps) {
  const { item } = props;
  switch (item.kind) {
    case 'mcq':
      return <ChoiceView {...props} item={item} />;
    case 'truefalse':
      return <TrueFalseView {...props} item={item} />;
    case 'matching':
      return <MatchingView {...props} item={item} />;
    case 'numeric':
      return <NumericView {...props} item={item} />;
    case 'reflection':
      return <ReflectionView {...props} item={item} />;
  }
}

const promptClass = 'font-display text-xl leading-snug';

const optionClass =
  'flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-rule px-3 py-2 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand has-[:disabled]:cursor-default';

function Option({
  name,
  checked,
  onSelect,
  disabled,
  letter,
  label,
  mark,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  disabled: boolean | undefined;
  letter: string;
  label: string;
  mark: 'correct' | 'wrong' | null;
}) {
  return (
    <label
      className={cx(
        optionClass,
        mark === 'correct' && 'border-success',
        mark === 'wrong' && 'border-danger',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
        className="size-4 shrink-0 accent-[var(--brand)]"
      />
      <span className="num w-5 shrink-0 text-sm text-muted">{letter}</span>
      <span className="flex-1 text-[0.95rem]">{label}</span>
      {mark === 'correct' ? (
        <span className="flex shrink-0 items-center gap-1 text-sm text-success">
          <Icon name="check" size={16} /> Correct answer
        </span>
      ) : mark === 'wrong' ? (
        <span className="flex shrink-0 items-center gap-1 text-sm text-danger">
          <Icon name="close" size={16} /> Your answer
        </span>
      ) : null}
    </label>
  );
}

function ChoiceView({
  item,
  response,
  onChange,
  disabled,
  showAnswer,
}: ItemViewProps & { item: McqItem }) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cx(promptClass, 'mb-3')}>{item.prompt}</legend>
      {item.options.map((o, i) => (
        <Option
          key={o.id}
          name={name}
          checked={response === o.id}
          onSelect={() => onChange(o.id)}
          disabled={disabled}
          letter={String.fromCharCode(65 + i)}
          label={o.label}
          mark={
            !showAnswer
              ? null
              : o.id === item.correctId
                ? 'correct'
                : response === o.id
                  ? 'wrong'
                  : null
          }
        />
      ))}
    </fieldset>
  );
}

function TrueFalseView({
  item,
  response,
  onChange,
  disabled,
  showAnswer,
}: ItemViewProps & { item: TrueFalseItem }) {
  const name = useId();
  const options = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cx(promptClass, 'mb-3')}>
        <span className="mb-1 block font-sans text-sm text-muted">True or false?</span>
        {item.prompt}
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <Option
            key={o.label}
            name={name}
            checked={response === o.value}
            onSelect={() => onChange(o.value)}
            disabled={disabled}
            letter={String.fromCharCode(65 + i)}
            label={o.label}
            mark={
              !showAnswer
                ? null
                : o.value === item.answer
                  ? 'correct'
                  : response === o.value
                    ? 'wrong'
                    : null
            }
          />
        ))}
      </div>
    </fieldset>
  );
}

function MatchingView({
  item,
  response,
  onChange,
  disabled,
  showAnswer,
}: ItemViewProps & { item: MatchingItem }) {
  const current: Record<string, string> = response && typeof response === 'object' ? response : {};
  const options = [
    { value: '', label: 'Choose…' },
    ...item.choices.map((c) => ({ value: c.id, label: c.label })),
  ];
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className={cx(promptClass, 'mb-3')}>{item.prompt}</legend>
      <ul className="flex flex-col gap-4">
        {item.pairs.map((p) => {
          const chosen = current[p.id] ?? '';
          const right = chosen === p.rightId;
          const correctLabel = item.choices.find((c) => c.id === p.rightId)?.label;
          return (
            <li key={p.id} className="grid grid-cols-1 gap-1">
              <Select
                label={p.left}
                value={chosen}
                options={options}
                disabled={disabled}
                onChange={(v) => onChange({ ...current, [p.id]: v })}
              />
              {showAnswer ? (
                <p
                  className={cx(
                    'flex items-center gap-1 text-sm',
                    right ? 'text-success' : 'text-danger',
                  )}
                >
                  <Icon name={right ? 'check' : 'close'} size={16} />
                  {right ? 'Correct' : `Correct match: ${correctLabel ?? ''}`}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function NumericView({
  item,
  response,
  onChange,
  disabled,
  inputError,
}: ItemViewProps & { item: NumericItem }) {
  // A fieldset whose legend is the question, so screen readers announce it with the field.
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className={cx(promptClass, 'mb-4')}>{item.prompt}</legend>
      <div className="max-w-64">
        <TextField
          label="Your answer"
          unit={item.unit || undefined}
          inputMode="decimal"
          autoComplete="off"
          value={typeof response === 'string' ? response : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          error={inputError}
          hint={
            item.unit
              ? `Type the number only; the unit (${item.unit}) is already given.`
              : 'Type the number only.'
          }
        />
      </div>
    </fieldset>
  );
}

function ReflectionView({
  item,
  response,
  onChange,
  disabled,
}: ItemViewProps & { item: ReflectionItem }) {
  const text = typeof response === 'string' ? response : '';
  const length = text.trim().length;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className={cx(promptClass, 'mb-4')}>{item.prompt}</legend>
      <TextArea
        label="Your answer"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        hint={
          length < item.minChars
            ? `Write at least ${item.minChars} characters (${length} so far).`
            : 'This answer is not marked right or wrong.'
        }
      />
    </fieldset>
  );
}
