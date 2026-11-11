(*---
description: Ported from TLC's IncompleteNextTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/IncompleteNextTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |
  SPECIFICATION
  Spec
args:
  - -deadlock
---*)
--------------------------- MODULE IncompleteNext ---------------------------
EXTENDS Integers, TLC

VARIABLES x, y

Spec == (x=0) /\ (y=0) /\ [][x'=x+1]_<<x,y>>
=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Action line 18, col 30 to line 18, col 35 of module IncompleteNext>
    /\ x = 1
    /\ y = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
