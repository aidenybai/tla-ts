(*---
description: A trace under symmetry prints the states as generated, and replaying the action for the trace runs its PrintT again.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  CONSTANTS A = A
  B = B
  C = C
  SYMMETRY Perms
  INVARIANT Inv
---*)
---- MODULE trace_under_symmetry ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x = {A}
Next == x' = x \cup {B} /\ PrintT(x)
Inv == Cardinality(x) < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | {A}
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = {A}
    | {A}
    2217:4 2: <Next line 20, col 9 to line 20, col 36 of module trace_under_symmetry>
    x = {A, B}
    | {A}
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
