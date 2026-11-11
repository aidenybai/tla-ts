(*---
description: Checks leads_to on the dead_end machine under weak_disjunction fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_dead_end__weak_disjunction__leads_to ----
EXTENDS Integers
VARIABLE x
Next == x = 0 /\ x' = 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(x = 0 /\ Next \/ x = 2 /\ Next)
Prop == (x = 0) ~> (x = 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \land in block line 16, col 43 to line 16, col 44 of module live_dead_end__weak_disjunction__leads_to and \lor.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 46.
    | ExtendableExpr starting at line 16, column 41.
    | ExtendableExpr starting at line 16, column 37.
    | Expression starting at line 16, column 37.
    | Optional Arguments starting at line 16, column 36.
    | Fatal errors while parsing TLA+ spec in file live_dead_end__weak_disjunction__leads_to
    | In module live_dead_end__weak_disjunction__leads_to
    | Could not parse module live_dead_end__weak_disjunction__leads_to from file live_dead_end__weak_disjunction__leads_to.tla
    | *** Errors: 1
    | In module live_dead_end__weak_disjunction__leads_to
    | Could not parse module live_dead_end__weak_disjunction__leads_to from file live_dead_end__weak_disjunction__leads_to.tla
    3002:1 Parsing or semantic analysis failed.
---*)
