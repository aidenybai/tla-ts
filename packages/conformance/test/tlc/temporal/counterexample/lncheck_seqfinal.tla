(*---
description: 'seqfinal runs the final check sequentially, with the same result.'
ref: tlc2/tool/liveness/LiveCheck.java#check0
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -lncheck
  - seqfinal
---*)
---- MODULE lncheck_seqfinal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == []<>(x = 99)
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
    2217:4 2: <Next line 17, col 9 to line 17, col 27 of module lncheck_seqfinal>
    x = 1
    2217:4 3: <Next line 17, col 9 to line 17, col 27 of module lncheck_seqfinal>
    x = 2
    2218:4 4: Stuttering
    2259:3 The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification Spec defined at line 18, col 1 to line 18, col 27 of module lncheck_seqfinal. To rule out such counterexamples, conjoin a suitable fairness constraint to Spec (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
