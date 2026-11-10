(*---
description: A type error in a POSTCONDITION reports the evaluation error and exits 10.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  SPECIFICATION Spec
  POSTCONDITION Post
---*)
---- MODULE type_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Post == TLCGet("stats").distinct = "a"
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2405:1 Evaluating postcondition Post at line 15, col 9 to line 15, col 38 of module type_error failed.
    Attempted to check equality of integer 2 with non-integer:
    "a"
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
