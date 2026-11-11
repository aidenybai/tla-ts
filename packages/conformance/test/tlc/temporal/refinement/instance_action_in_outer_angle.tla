(*---
description: 'An abstract action can be used in an outer temporal formula.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness, refinement]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE instance_action_in_outer_angle ----
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
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
A == INSTANCE Abs WITH v <- x

Prop == []<><<A!ANext>>_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <N line 23, col 6 to line 23, col 24 of module instance_action_in_outer_angle>
    x = 1
    2217:4 3: <N line 23, col 6 to line 23, col 24 of module instance_action_in_outer_angle>
    x = 2
    2218:4 4: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
