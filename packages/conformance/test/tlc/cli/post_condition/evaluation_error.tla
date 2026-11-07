(*---
description: A -postCondition that fails to evaluate reports TLC_POSTCONDITION_EVALUATION_ERROR and exits 10.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
args:
  - -postCondition
  - cli_post_fixture!Broken
includes:
  - cli_post_fixture.tla
---*)
---- MODULE evaluation_error ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2405:1 Evaluating postcondition Broken at line 5, col 11 to line 5, col 40 of module cli_post_fixture failed.
    Attempted to check equality of integer 3 with non-integer:
    "a"
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
