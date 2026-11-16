(*---
description: 'A subscript of only b hides steps of Go, since Go leaves b unchanged: <<Go>>_b is never enabled.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE weak_subscript_b_only ----
VARIABLES b, d
vars == <<b, d>>
Flip == b' = ~b /\ UNCHANGED d
Go == b /\ ~d /\ d' = TRUE /\ UNCHANGED b
Next == Flip \/ Go
Init == b = FALSE /\ d = FALSE
Prop == <>d

Spec == Init /\ [][Next]_vars /\ WF_b(Go) /\ SF_b(Go) /\ WF_vars(Flip)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ b = FALSE
    /\ d = FALSE
    2217:4 2: <Flip line 14, col 9 to line 14, col 30 of module weak_subscript_b_only>
    /\ b = TRUE
    /\ d = FALSE
    2122:4 1: Back to state: <Flip line 14, col 9 to line 14, col 30 of module weak_subscript_b_only>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 6 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
