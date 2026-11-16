(*---
description: A non-Boolean POSTCONDITION fails with the message for evaluation errors.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE non_boolean ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Post == 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2405:1 Evaluating postcondition Post at 1 failed.
    2215:0 TLC expected a boolean value, but did not find one. 1
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
