(*---
description: INVARIANT and INVARIANTS share one list, so names under each spelling all count.
ref: tlc2/tool/impl/ModelConfig.java#ModelConfig
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT A
  INVARIANTS B
---*)
---- MODULE invariant_and_invariants_share_a_list ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == TRUE
B == x = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2149:3 The invariant A is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant B is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module invariant_and_invariants_share_a_list>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
