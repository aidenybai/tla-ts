(*---
description: Ported from TLC's TraceWithLargeSetOfInitialStatesTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/TraceWithLargeSetOfInitialStatesTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -maxSetSize
  - "10"
  - -deadlock
---*)
---------------- MODULE TraceWithLargeSetOfInitialStatesTest ----------------
EXTENDS Integers

VARIABLES x,y

Spec == (x \in 1..11 /\ y = FALSE) /\ [][x' = x /\ y' = TRUE]_<<x,y>>

Inv == y = FALSE
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2190:0 Finished computing initial states: 11 distinct states generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 1
    /\ y = FALSE
    2217:4 2: <Action line 22, col 42 to line 22, col 60 of module TraceWithLargeSetOfInitialStatesTest>
    /\ x = 1
    /\ y = TRUE
    2199:0 12 states generated, 12 distinct states found, 10 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
