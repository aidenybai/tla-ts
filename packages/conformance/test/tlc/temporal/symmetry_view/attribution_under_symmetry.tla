(*---
description: 'Attribution evaluates the property on reconstructed trace states.'
ref: tlc2/tool/AbstractChecker.java#AbstractChecker
features: [liveness, symmetry]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  CONSTANT S = {a, b}
  SYMMETRY Perms
  PROPERTY P2 P1
---*)
---- MODULE attribution_under_symmetry ----
EXTENDS Naturals, TLC
CONSTANT S
VARIABLE owner
Next == \E p \in S : owner = "none" /\ owner' = p
Release == owner # "none" /\ owner' = "none"
All == Next \/ Release
Spec == owner = "none" /\ [][All]_owner /\ WF_owner(All)
Perms == Permutations(S)
P1 == <>(owner = "x")
P2 == <>(owner = "none")
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2279:3 Declaring symmetry during liveness checking is dangerous. It might cause TLC to miss violations of the stated liveness properties. Please check liveness without symmetry defined.
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property P1 was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    owner = "none"
    2217:4 2: <Next line 16, col 22 to line 16, col 49 of module attribution_under_symmetry>
    owner = a
    2122:4 1: Back to state: <Release line 17, col 12 to line 17, col 44 of module attribution_under_symmetry>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
