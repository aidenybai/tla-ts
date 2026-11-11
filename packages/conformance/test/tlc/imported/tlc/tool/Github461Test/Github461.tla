(*---
description: Ported from TLC's Github461Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github461Test.java
features:
  - tlc-regression
outcome: assertion-failure
config: |
  INIT
  Init
  NEXT
  Next
args:
  - -deadlock
---*)
----------------------------- MODULE Github461 -----------------------------
EXTENDS Integers, TLC

VARIABLES x

Init == x = 0

Next == 
    /\ Assert(x < 4, "Failure of assertion at line 8, column 4.")
    /\ x' = x + 1

====

(*--- recorded
all:
  exit: 14
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2132:1 The first argument of Assert evaluated to FALSE; the second argument was:
    "Failure of assertion at line 8, column 4."
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 23, col 5 to line 24, col 17 of module Github461>
    x = 1
    2217:4 3: <Next line 23, col 5 to line 24, col 17 of module Github461>
    x = 2
    2217:4 4: <Next line 23, col 5 to line 24, col 17 of module Github461>
    x = 3
    2217:4 5: <Next line 23, col 5 to line 24, col 17 of module Github461>
    x = 4
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 23, column 5 to line 24, column 17 in Github461
    1. Line 23, column 8 to line 23, column 65 in Github461
    2199:0 5 states generated, 5 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 5.
---*)
