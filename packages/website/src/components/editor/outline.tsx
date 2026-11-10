import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { Outline as OutlineData } from "@/lib/outline";
import { Chip } from "./chip";
import { useActiveName, useViewer } from "./viewer-context";

interface SectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

const Section = ({ title, count, children }: SectionProps) => (
  <section className="grid gap-2">
    <header className="flex items-center gap-3">
      <h3 className="font-medium text-text-2">{title}</h3>
      <span className="h-px flex-1 bg-rule" />
      {count > 0 && <span className="text-muted tabular-nums">{count}</span>}
    </header>
    {count === 0 ? <p className="text-faint">None</p> : <ul className="grid">{children}</ul>}
  </section>
);

const Row = ({ children }: { children: ReactNode }) => (
  <li className="grid gap-1.5 border-t border-rule py-2 first:border-t-0">{children}</li>
);

const Code = ({ children }: { children: ReactNode }) => (
  <code className="font-mono wrap-anywhere text-text-2">{children}</code>
);

const useOutline = (): OutlineData =>
  useViewer().outline ?? { variables: [], actions: [], checks: [], definitions: [] };

const Root = ({ children }: { children: ReactNode }) => {
  const activeName = useActiveName();
  return (
    <div
      data-has-active={activeName !== undefined || undefined}
      className="grid h-full content-start gap-5 overflow-auto px-4 py-4 sm:px-5"
    >
      {children}
    </div>
  );
};

const Variables = () => {
  const variables = useOutline().variables;
  return (
    <Section title="Variables" count={variables.length}>
      {variables.map((variable) => (
        <Row key={variable.name}>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Chip name={variable.name}>{variable.name}</Chip>
            {variable.type !== undefined && <Code>{variable.type}</Code>}
          </span>
          {variable.initial !== undefined && (
            <span className="pl-1 font-mono wrap-anywhere">
              <span className="text-faint">Init </span>
              <Code>{variable.initial}</Code>
            </span>
          )}
        </Row>
      ))}
    </Section>
  );
};

const VariableChips = ({ label, names }: { label: string; names: string[] }) =>
  names.length > 0 && (
    <span className="flex flex-wrap items-baseline gap-1">
      <span className="w-12 text-muted">{label}</span>
      {names.map((name) => (
        <Chip key={name} name={name}>
          {name}
        </Chip>
      ))}
    </span>
  );

const Actions = () => {
  const actions = useOutline().actions;
  return (
    <Section title="Actions" count={actions.length}>
      {actions.map((action) => (
        <Row key={action.name}>
          <span>
            <Chip name={action.name}>{action.head}</Chip>
          </span>
          <VariableChips label="writes" names={action.writes} />
          <VariableChips label="reads" names={action.reads} />
        </Row>
      ))}
    </Section>
  );
};

const Checks = () => {
  const checks = useOutline().checks;
  return (
    <Section title="Checks" count={checks.length}>
      {checks.map((check) => (
        <Row key={check.name}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <Chip name={check.name}>{check.head}</Chip>
            {check.role !== undefined && <Badge>{check.role}</Badge>}
          </span>
        </Row>
      ))}
    </Section>
  );
};

const Definitions = () => {
  const definitions = useOutline().definitions;
  return (
    <Section title="Definitions" count={definitions.length}>
      {definitions.map((definition) => (
        <Row key={definition.name}>
          <span>
            <Chip name={definition.name}>{definition.head}</Chip>
          </span>
        </Row>
      ))}
    </Section>
  );
};

export const Outline = Object.assign(Root, { Variables, Actions, Checks, Definitions });
