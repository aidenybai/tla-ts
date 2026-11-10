(*---
description: An unknown field of TLCGet("stats") fails inside the POSTCONDITION.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  SPECIFICATION Spec
  POSTCONDITION Post
---*)
---- MODULE unknown_stats_key ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Post == TLCGet("stats").nope = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2405:1 Evaluating postcondition Post at line 15, col 9 to line 15, col 32 of module unknown_stats_key failed.
    Attempted to select nonexistent field "nope" from the record
    [ queue |-> 0,
      distinct |-> 2,
      initial |-> 1,
      generated |-> 3,
      diameter |-> 2,
      duration |-> 0,
      worker |-> 0 ]
    line 15, col 9 to line 15, col 28 of module unknown_stats_key
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
