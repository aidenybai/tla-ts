(*---
description: Checks leads_to on the two_cycles machine under weak_disjunction fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_two_cycles__weak_disjunction__leads_to ----
EXTENDS Integers
VARIABLE x
Next == \/ x \in {0, 1} /\ x' = 1 - x
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x /\ WF_x(x = 0 /\ Next \/ x = 2 /\ Next)
Prop == (x = 0) ~> (x = 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \land in block line 18, col 43 to line 18, col 44 of module live_two_cycles__weak_disjunction__leads_to and \lor.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 18, column 46.
    | ExtendableExpr starting at line 18, column 41.
    | ExtendableExpr starting at line 18, column 37.
    | Expression starting at line 18, column 37.
    | Optional Arguments starting at line 18, column 36.
    | Fatal errors while parsing TLA+ spec in file live_two_cycles__weak_disjunction__leads_to
    | In module live_two_cycles__weak_disjunction__leads_to
    | Could not parse module live_two_cycles__weak_disjunction__leads_to from file live_two_cycles__weak_disjunction__leads_to.tla
    | *** Errors: 1
    | In module live_two_cycles__weak_disjunction__leads_to
    | Could not parse module live_two_cycles__weak_disjunction__leads_to from file live_two_cycles__weak_disjunction__leads_to.tla
    3002:1 Parsing or semantic analysis failed.
---*)
