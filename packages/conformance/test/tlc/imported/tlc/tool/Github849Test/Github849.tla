(*---
description: Ported from TLC's Github849Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github849Test.java
features:
  - tlc-regression
outcome: safety-violation
args:
  - -config
  - Github849.tla
  - -deadlock
---*)
---------------------------- MODULE Github849 ---------------------------

CONSTANTS
    Nodes

VARIABLES
    n,
    node_set

TypeOK ==
    /\ n = 1

Init ==
    /\ n = 1
    /\ node_set = {}

Next ==
    /\ n' = 2
    /\ node_set' = {v \in SUBSET Nodes : FALSE}

==========================================================================
---------------------------- CONFIG Github849 ----------------------------

INIT Init
NEXT Next

CONSTANT Nodes = {A1}

CHECK_DEADLOCK FALSE
INVARIANT TypeOK

===========================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant TypeOK is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ node_set = {}
    /\ n = 1
    2217:4 2: <Next line 29, col 5 to line 30, col 47 of module Github849>
    /\ node_set = {}
    /\ n = 2
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
