(*---
description: '[]FALSE is an invariant violated by the first state.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_false_invariant ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == []FALSE
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant FALSE is violated by the initial state:
    x = 0
---*)
