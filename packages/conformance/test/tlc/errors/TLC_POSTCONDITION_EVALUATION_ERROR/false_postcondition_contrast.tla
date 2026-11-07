(*---
description: A false POSTCONDITION reports TLC_POSTCONDITION_FALSE instead.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  SPECIFICATION Spec
  POSTCONDITION Post
---*)
---- MODULE false_postcondition_contrast ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Post == TLCGet("stats").distinct = 99
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition Post at line 15, col 9 to line 15, col 37 of module false_postcondition_contrast is false.
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
