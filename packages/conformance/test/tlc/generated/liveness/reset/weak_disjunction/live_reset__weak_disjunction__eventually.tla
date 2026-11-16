(*---
description: Checks eventually on the reset machine under weak_disjunction fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_reset__weak_disjunction__eventually ----
EXTENDS Integers
VARIABLE x
Next == x' = IF x = 0 THEN 2 ELSE x - 1
Spec == x = 2 /\ [][Next]_x /\ WF_x(x = 0 /\ Next \/ x = 2 /\ Next)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \land in block line 16, col 43 to line 16, col 44 of module live_reset__weak_disjunction__eventually and \lor.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 46.
    | ExtendableExpr starting at line 16, column 41.
    | ExtendableExpr starting at line 16, column 37.
    | Expression starting at line 16, column 37.
    | Optional Arguments starting at line 16, column 36.
    | Fatal errors while parsing TLA+ spec in file live_reset__weak_disjunction__eventually
    | In module live_reset__weak_disjunction__eventually
    | Could not parse module live_reset__weak_disjunction__eventually from file live_reset__weak_disjunction__eventually.tla
    | *** Errors: 1
    | In module live_reset__weak_disjunction__eventually
    | Could not parse module live_reset__weak_disjunction__eventually from file live_reset__weak_disjunction__eventually.tla
    3002:1 Parsing or semantic analysis failed.
---*)
