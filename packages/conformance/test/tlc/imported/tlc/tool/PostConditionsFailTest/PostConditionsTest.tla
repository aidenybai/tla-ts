(*---
description: Ported from TLC's PostConditionsFailTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/PostConditionsFailTest.java
features:
  - tlc-regression
outcome: assumption-violation
config: |
  SPECIFICATION Spec
  POSTCONDITIONS Post1 Post2 PostFail
args:
  - -deadlock
---*)
---- MODULE PostConditionsTest ----
EXTENDS Naturals, TLC
VARIABLE x

Init == x = 0

Next == x < 3 /\ x' = x + 1

Spec == Init /\ [][Next]_x

Post1 == TLCSet(100, TLCGet("generated"))

Post2 == TLCSet(101, TLCGet("distinct"))

PostFail == TLCGet("distinct") = 42

AtTwo == x = 2

LastStep == x = 2 /\ x' = 3

PossibleCounts ==
    LET p == TLCGet("all:named")["s:_possible"][1]
    IN /\ p["AtTwo"] = 1
       /\ p["LastStep"] = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition PostFail at line 27, col 13 to line 27, col 35 of module PostConditionsTest is false.
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
