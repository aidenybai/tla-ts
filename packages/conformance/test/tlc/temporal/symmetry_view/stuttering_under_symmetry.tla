(*---
description: 'A stuttering tail under symmetry prints as usual.'
ref: tlc2/tool/AbstractChecker.java#AbstractChecker
features: [liveness, symmetry]
outcome: liveness-violation
config: |
  SPECIFICATION Spec2
  CONSTANT S = {a, b}
  SYMMETRY Perms
  PROPERTY Prop
---*)
---- MODULE stuttering_under_symmetry ----
EXTENDS Naturals, TLC
CONSTANT S
VARIABLE owner
Next == \E p \in S : owner = "none" /\ owner' = p
Release == owner # "none" /\ owner' = "none"
All == Next \/ Release
Spec == owner = "none" /\ [][All]_owner /\ WF_owner(All)
Perms == Permutations(S)
Prop == []<>(owner = "none")
Spec2 == owner = "none" /\ [][All]_owner
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2279:3 Declaring symmetry during liveness checking is dangerous. It might cause TLC to miss violations of the stated liveness properties. Please check liveness without symmetry defined.
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    owner = "none"
    2217:4 2: <Next line 16, col 22 to line 16, col 49 of module stuttering_under_symmetry>
    owner = a
    2218:4 3: Stuttering
    2259:3 The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification Spec2 defined at line 22, col 1 to line 22, col 40 of module stuttering_under_symmetry. To rule out such counterexamples, conjoin a suitable fairness constraint to Spec2 (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
