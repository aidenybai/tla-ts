(*---
description: A function to records nests the wrapping indentation.
ref: tlc2/value/Values.java#ppr
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE nested_function_of_records_wraps ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = [i \in {"server1", "server2", "server3"} |-> [state |-> "follower", term |-> 10000, log |-> <<1, 2, 3>>]]
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
    2217:4 2: <Next line 14, col 9 to line 14, col 118 of module nested_function_of_records_wraps>
    x = [ server1 |-> [state |-> "follower", term |-> 10000, log |-> <<1, 2, 3>>],
      server2 |-> [state |-> "follower", term |-> 10000, log |-> <<1, 2, 3>>],
      server3 |-> [state |-> "follower", term |-> 10000, log |-> <<1, 2, 3>>] ]
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
