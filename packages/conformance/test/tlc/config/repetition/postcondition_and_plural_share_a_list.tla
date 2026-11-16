(*---
description: POSTCONDITION and POSTCONDITIONS share one list, so the false check under the plural spelling fails the run.
ref: tlc2/tool/impl/ModelConfig.java#ModelConfig
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION A
  POSTCONDITIONS B
---*)
---- MODULE postcondition_and_plural_share_a_list ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == TLCGet("stats").distinct = 3
B == TLCGet("stats").distinct = 99
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition B at line 17, col 6 to line 17, col 34 of module postcondition_and_plural_share_a_list is false.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
