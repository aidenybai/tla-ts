(*---
description: 'With -lncheck off, the no-orders-of-solution check still fails.'
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -lncheck
  - off
---*)
---- MODULE lncheck_off_tautology_still_checked ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == <>[]TRUE => TRUE
====

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
