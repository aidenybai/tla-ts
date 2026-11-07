(*---
description: A non-Boolean state predicate in a temporal property stops liveness with this message.
ref: tlc2/tool/liveness/LNStateAST.java#eval
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE integer_in_eventually ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Prop == <>x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2250:0 A state predicate was evaluated to a non-boolean value.
    | While working on the initial state:
    | x = 0
    2250:0 A state predicate was evaluated to a non-boolean value.
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
