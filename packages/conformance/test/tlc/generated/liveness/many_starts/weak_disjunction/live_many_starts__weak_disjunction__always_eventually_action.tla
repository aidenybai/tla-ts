(*---
description: Checks always_eventually_action on the many_starts machine under weak_disjunction fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_many_starts__weak_disjunction__always_eventually_action ----
EXTENDS Integers
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x \in 0..2 /\ [][Next]_x /\ WF_x(x = 0 /\ Next \/ x = 2 /\ Next)
Prop == []<><<x' = 0>>_x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \land in block line 16, col 48 to line 16, col 49 of module live_many_starts__weak_disjunction__always_eventually_action and \lor.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 51.
    | ExtendableExpr starting at line 16, column 46.
    | ExtendableExpr starting at line 16, column 42.
    | Expression starting at line 16, column 42.
    | Optional Arguments starting at line 16, column 41.
    | Fatal errors while parsing TLA+ spec in file live_many_starts__weak_disjunction__always_eventually_action
    | In module live_many_starts__weak_disjunction__always_eventually_action
    | Could not parse module live_many_starts__weak_disjunction__always_eventually_action from file live_many_starts__weak_disjunction__always_eventually_action.tla
    | *** Errors: 1
    | In module live_many_starts__weak_disjunction__always_eventually_action
    | Could not parse module live_many_starts__weak_disjunction__always_eventually_action from file live_many_starts__weak_disjunction__always_eventually_action.tla
    3002:1 Parsing or semantic analysis failed.
---*)
