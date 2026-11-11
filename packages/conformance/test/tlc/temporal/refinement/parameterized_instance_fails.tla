(*---
description: 'A parameterized instance reports its implied init failure.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness, refinement]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE parameterized_instance_fails ----
EXTENDS Naturals
VARIABLE x

---- MODULE Abs ----
EXTENDS Naturals
VARIABLE v
AInit == v = 0
ANext == v < 2 /\ v' = v + 1
ASpec == AInit /\ [][ANext]_v
ALive == ASpec /\ WF_v(ANext)
====
N == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x
A(y) == INSTANCE Abs WITH v <- y
Prop == A(x + 1)!ASpec
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2108:1 Property AInit is violated by the initial state:
    x = 0
---*)
