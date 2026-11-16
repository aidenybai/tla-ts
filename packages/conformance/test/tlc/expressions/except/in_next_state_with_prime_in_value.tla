(*---
description: "A primed variable can be read in the new value of an EXCEPT clause once it has been assigned."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE in_next_state_with_prime_in_value ----
EXTENDS Integers
VARIABLES x, y
Init == x = 0 /\ y = <<0>>
Next == /\ x' = x + 1
        /\ y' = [y EXCEPT ![1] = x']
        /\ x < 2
Inv == y[1] = x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = <<0>>
    2217:4 2: <Next line 14, col 9 to line 16, col 16 of module in_next_state_with_prime_in_value>
    /\ x = 1
    /\ y = <<1>>
    2217:4 3: <Next line 14, col 9 to line 16, col 16 of module in_next_state_with_prime_in_value>
    /\ x = 2
    /\ y = <<2>>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
