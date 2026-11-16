(*---
description: 'With a false constraint on the initial state, a []P form is still checked as it is unseen.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness, constraint]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CONSTRAINT No
---*)
---- MODULE constraint_excludes_all_initial_invariant_form ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Con == x <= 2
No == x > 5
Prop == [](x = 99)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Prop is violated by the initial state:
    x = 0
---*)
