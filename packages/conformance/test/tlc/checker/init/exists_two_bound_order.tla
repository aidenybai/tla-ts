(*---
description: "\\E a \\in S, b \\in T: varies the first bound fastest, unlike the cartesian product."
ref: tlc2/util/Context.java ContextEnumerator
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exists_two_bound_order ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == \E a \in 1..2, b \in {"p", "q"} : x = a /\ y = b /\ PrintT(<<a, b>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, "p">>
    | <<2, "p">>
    | <<1, "q">>
    2269:0 Computed 2 initial states...
    | <<2, "q">>
    2190:0 Finished computing initial states: 4 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 8.7E-19
    2199:0 8 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
