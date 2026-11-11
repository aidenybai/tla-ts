(*---
description: "EXCEPT in an action reads the current value through @."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE in_next_state ----
EXTENDS Integers
VARIABLE x
Init == x = [a |-> 0, b |-> <<0>>]
Next == /\ x.a < 2
        /\ x' = [x EXCEPT !.a = @ + 1, !.b[1] = @ + 2]
Inv == x.b[1] = 2 * x.a
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = [a |-> 0, b |-> <<0>>]
    2217:4 2: <Next line 14, col 9 to line 15, col 54 of module in_next_state>
    x = [a |-> 1, b |-> <<2>>]
    2217:4 3: <Next line 14, col 9 to line 15, col 54 of module in_next_state>
    x = [a |-> 2, b |-> <<4>>]
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
