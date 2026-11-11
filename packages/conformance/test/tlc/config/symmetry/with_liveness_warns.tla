(*---
description: SYMMETRY with a temporal property prints a warning, because liveness checking under symmetry may miss violations.
ref: tlc2/tool/AbstractChecker.java#AbstractChecker
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CONSTANT S = {a, b}
  SYMMETRY Sym
---*)
---- MODULE with_liveness_warns ----
EXTENDS TLC, Naturals
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == Permutations(S)
Spec == Init /\ [][Next]_x
Prop == <>(x \in S)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2279:3 Declaring symmetry during liveness checking is dangerous. It might cause TLC to miss violations of the stated liveness properties. Please check liveness without symmetry defined.
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2191:0 Finished computing initial states: 2 states generated, with 1 of them distinct at <date>.
    2192:0 Checking temporal properties for the complete state space with 1 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
