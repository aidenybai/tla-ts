(*---
description: '[] of a constant-level formula is level < 2 so becomes an invariant, even a false one.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_constant_is_invariant ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [](1 = 2)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Prop is violated by the initial state:
    x = 0
---*)
