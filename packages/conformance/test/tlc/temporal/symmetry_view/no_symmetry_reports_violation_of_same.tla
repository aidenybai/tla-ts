(*---
description: 'Without SYMMETRY, the same property fails on the cycle through b.'
ref: tlc2/tool/liveness/LiveCheck.java#addNextState
features: [liveness, symmetry]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  CONSTANT a = a
  CONSTANT b = b
  CONSTANT S = {a, b}
  PROPERTY Prop
---*)
---- MODULE no_symmetry_reports_violation_of_same ----
EXTENDS Naturals, TLC
CONSTANTS S, a, b
VARIABLE owner
Next == \E p \in S : owner = "none" /\ owner' = p
Release == owner # "none" /\ owner' = "none"
All == Next \/ Release
Spec == owner = "none" /\ [][All]_owner /\ WF_owner(All)
Perms == Permutations(S)
Prop == []<>(owner = a)
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
    owner = "none"
    2217:4 2: <Next line 17, col 22 to line 17, col 49 of module no_symmetry_reports_violation_of_same>
    owner = b
    2122:4 1: Back to state: <Release line 18, col 12 to line 18, col 44 of module no_symmetry_reports_violation_of_same>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
