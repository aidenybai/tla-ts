(*---
description: An initial state that fails the constraint isn't added, but the invariant still checks it.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTRAINT Con
---*)
---- MODULE excluded_initial_state_invariant_checked ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 5
Next == x' = x
Con == x < 2
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 5
---*)
