(*---
description: A set of records prints in value order.
ref: tlc2/value/Values.java#ppr
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE set_of_records_sorted ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = {[a |-> 2], [a |-> 1]}
Inv == TLCGet("level") < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 35 of module set_of_records_sorted>
    x = {[a |-> 1], [a |-> 2]}
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
