(*---
description: Swapping the order of two false invariants swaps which one is reported.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT A
  INVARIANT B
---*)
---- MODULE invariant_order_reversed ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == x = 0
B == x = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant A is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module invariant_order_reversed>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
