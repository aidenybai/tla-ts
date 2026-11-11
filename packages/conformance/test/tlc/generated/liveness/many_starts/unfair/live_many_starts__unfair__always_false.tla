(*---
description: Checks always_false on the many_starts machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_many_starts__unfair__always_false ----
EXTENDS Integers
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x \in 0..2 /\ [][Next]_x
Prop == [](x = 0)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Prop is violated by the initial state:
    x = 1
---*)
