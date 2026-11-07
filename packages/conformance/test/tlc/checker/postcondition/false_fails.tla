(*---
description: A false POSTCONDITION reports its name and exits with the assumption status.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE false_fails ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Post == TLCGet("level") = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition Post at line 15, col 9 to line 15, col 27 of module false_fails is false.
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
