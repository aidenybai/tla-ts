(*---
description: A POSTCONDITION reading a variable fails since there's no state.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE reads_variable ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Post == x = 0
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 15, col 9 to line 15, col 9 of module reads_variable
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 15, col 9 to line 15, col 9 of module reads_variable
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
