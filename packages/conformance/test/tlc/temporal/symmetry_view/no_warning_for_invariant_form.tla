(*---
description: 'A []P property is an invariant with checkLiveness false: no warning.'
ref: tlc2/tool/AbstractChecker.java#AbstractChecker
features: [liveness, symmetry]
outcome: success
config: |
  SPECIFICATION Spec
  CONSTANT S = {a, b}
  SYMMETRY Perms
  PROPERTY Prop
---*)
---- MODULE no_warning_for_invariant_form ----
EXTENDS Naturals, TLC
CONSTANT S
VARIABLE owner
Next == \E p \in S : owner = "none" /\ owner' = p
Release == owner # "none" /\ owner' = "none"
All == Next \/ Release
Spec == owner = "none" /\ [][All]_owner /\ WF_owner(All)
Perms == Permutations(S)
Prop == [](owner \in S \cup {"none"})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
