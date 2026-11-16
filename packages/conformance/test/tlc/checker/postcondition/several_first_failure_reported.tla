(*---
description: Of several POSTCONDITION entries, the first false one is reported and later ones aren't evaluated.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION P1
  POSTCONDITION P2
---*)
---- MODULE several_first_failure_reported ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
P1 == PrintT(<<"one", TLCGet("level")>>) /\ FALSE
P2 == PrintT(<<"two", TLCGet("level")>>) /\ FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<"one", 0>>
    2404:1 Postcondition P1 at line 16, col 7 to line 16, col 49 of module several_first_failure_reported is false.
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
