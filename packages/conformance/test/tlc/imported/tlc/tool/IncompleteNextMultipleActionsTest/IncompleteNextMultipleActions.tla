(*---
description: Ported from TLC's IncompleteNextMultipleActionsTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/IncompleteNextMultipleActionsTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |
  SPECIFICATION
  Spec
args:
  - -deadlock
---*)
--------------------------- MODULE IncompleteNextMultipleActions ---------------------------
EXTENDS Integers, TLC

VARIABLES x, y, z

A1 == x'= x + 1

A2 == x'= 1 /\ y' = 1 /\ z' = 1

Spec == (x=0) /\ (y=0) /\ (z=0) /\ [][A1 \/ A2]_<<x,y,z>>
=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by action A1 of the next-state relation. The following variables are not defined: y, z.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    /\ z = 0
    2217:4 2: <A1 line 18, col 7 to line 18, col 15 of module IncompleteNextMultipleActions>
    /\ x = 1
    /\ y = null
    /\ z = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
