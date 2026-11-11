(*---
description: 'With INIT and NEXT, a stuttering counterexample with a cycle-dependent property gets TLC_CONFIG_NO_SPEC_BUT_PROPERTY.'
ref: tlc2/tool/liveness/Liveness.java#printStutteringCounterExampleWarning
features: [liveness]
outcome: liveness-violation
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE no_spec_property_warning ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Prop == []<>(x = 2)
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
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module no_spec_property_warning>
    x = 1
    2218:4 3: Stuttering
    2257:3 The stuttering counterexample above may be caused by the absence of a behavior specification (SPECIFICATION). Only INIT and NEXT have been provided, so TLC permits infinite stuttering. To rule out such counterexamples, use SPECIFICATION Spec, with Spec asserting a suitable fairness constraint (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
