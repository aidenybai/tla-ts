(*---
description: 'A number on the left of an implication with a temporal right side fails at evaluation the same way.'
ref: tlc2/tool/liveness/LNStateAST.java#eval
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE non_boolean_state_in_implication ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x => <>(x = 2)
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
