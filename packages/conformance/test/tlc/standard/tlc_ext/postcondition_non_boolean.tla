(*---
description: A non-Boolean POSTCONDITION is an error.
ref: tlc2/tool/AbstractChecker.java#checkPostCondition
features:
  - TLCExt
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE postcondition_non_boolean ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2215:0 TLC expected a boolean value, but did not find one. 1
    2215:0 TLC expected a boolean value, but did not find one. 1
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
