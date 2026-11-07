(*---
description: "A POSTCONDITION that yields a non-Boolean reports TLC_EXPECTED_VALUE and still exits 10, so neither the false nor the evaluation error message appears."
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  SPECIFICATION Spec
  POSTCONDITION Post
---*)
---- MODULE non_boolean_value ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Post == TLCGet("stats").distinct
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2215:0 TLC expected a boolean value, but did not find one. line 15, col 9 to line 15, col 32 of module non_boolean_value
    2215:0 TLC expected a boolean value, but did not find one. line 15, col 9 to line 15, col 32 of module non_boolean_value
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
