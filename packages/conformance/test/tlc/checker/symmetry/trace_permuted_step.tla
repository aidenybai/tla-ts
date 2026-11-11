(*---
description: A trace under symmetry prints each state as generated.
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
---- MODULE trace_permuted_step ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Len(s) == Cardinality(DOMAIN s)
Append(s, m) == [i \in 1..(Len(s) + 1) |-> IF i <= Len(s) THEN s[i] ELSE m]
Init == x = <<A>>
Next == x' = IF Len(x) < 3 THEN Append(x, x[1]) ELSE x
Inv == Len(x) < 3
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = <<A>>
    2217:4 2: <Next line 22, col 9 to line 22, col 54 of module trace_permuted_step>
    x = <<A, A>>
    2217:4 3: <Next line 22, col 9 to line 22, col 54 of module trace_permuted_step>
    x = <<A, A, A>>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
