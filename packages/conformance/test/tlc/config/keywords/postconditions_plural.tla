(*---
description: POSTCONDITIONS names a check that runs after the model finishes, and it fails here because the model has 3 distinct states.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITIONS Post
---*)
---- MODULE postconditions_plural ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == TLCGet("stats").distinct = 99
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition Post at line 15, col 9 to line 15, col 37 of module postconditions_plural is false.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
