(*---
description: A FALSE POSTCONDITION fails the run.
ref: tlc2/tool/AbstractChecker.java#checkPostCondition
features:
  - TLCExt
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE postcondition_false ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == TLCGet("distinct") = 0
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition Post at line 17, col 9 to line 17, col 30 of module postcondition_false is false.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
