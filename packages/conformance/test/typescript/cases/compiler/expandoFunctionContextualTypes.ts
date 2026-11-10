/*---
description: Ported from TypeScript's tests/cases/compiler/expandoFunctionContextualTypes.ts.
outcome: success
source: tests/cases/compiler/expandoFunctionContextualTypes.ts
---*/
// @target: es2015
interface MyComponentProps {
    color: "red" | "blue"
}

interface StatelessComponent<P> {
    (): any;
    defaultProps?: Partial<P>;
}

const MyComponent: StatelessComponent<MyComponentProps> = () => null as any;

MyComponent.defaultProps = {
    color: "red"
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
