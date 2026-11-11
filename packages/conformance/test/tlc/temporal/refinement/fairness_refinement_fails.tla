(*---
description: 'An implementation with no fairness fails the abstract WF: a stutter at the state with ANext enabled.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness, refinement]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE fairness_refinement_fails ----
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
A == INSTANCE Abs WITH v <- x

Prop == A!ALive
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
    2218:4 2: Stuttering
    2259:3 The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification Spec defined at line 24, col 1 to line 24, col 24 of module fairness_refinement_fails. To rule out such counterexamples, conjoin a suitable fairness constraint to Spec (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
