(*---
description: 'A quantifier set with a substituted variable fails the same as an unsubstituted one.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness, refinement]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE instance_quantifier_set_uses_variable ----
EXTENDS Naturals
VARIABLE x

---- MODULE Abs ----
EXTENDS Naturals
VARIABLE v
AInit == v = 0
ANext == v < 2 /\ v' = v + 1
ASpec == AInit /\ [][ANext]_v
Goal == \A t \in {v} : <>(v = t)
====
N == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
A == INSTANCE Abs WITH v <- x

Prop == A!Goal
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2213:1 TLC cannot handle the temporal formula line 21, col 9 to line 21, col 32 of module instance_quantifier_set_uses_variable:
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 25, col 29 to line 25, col 29 of module instance_quantifier_set_uses_variable
---*)
