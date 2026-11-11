(*---
description: Ported from TLC's FingerprintExceptionHangTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/FingerprintExceptionHangTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  CONSTANT Nodes = {A, B}
  CHECK_DEADLOCK FALSE
  INVARIANT TypeOK
args:
  - -deadlock
---*)
---- MODULE FingerprintExceptionHang ----

EXTENDS Naturals

CONSTANTS
    Nodes

VARIABLES
    node_state

vars == <<node_state>>

LegalSets == {{}}

TypeOK ==
    node_state \in [Nodes -> [set: LegalSets]]

Init ==
    \E initial_members \in LegalSets:
        node_state = [n \in Nodes |-> [set |-> initial_members]]

Next ==
    \E n \in Nodes, new_members \in {1}:
        node_state' = [node_state EXCEPT ![n].set = new_members]

Spec == Init /\ [][Next]_vars

====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2111:1 Evaluating invariant TypeOK failed.
    Attempted to compare integer 1 with non-integer:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    node_state = (A :> [set |-> {}] @@ B :> [set |-> {}])
    2217:4 2: <Next line 38, col 9 to line 38, col 64 of module FingerprintExceptionHang>
    node_state = (A :> [set |-> 1] @@ B :> [set |-> {}])
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 30, column 5 to line 30, column 46 in FingerprintExceptionHang
    1. Line 30, column 20 to line 30, column 46 in FingerprintExceptionHang
    2. Line 30, column 30 to line 30, column 45 in FingerprintExceptionHang


    Reason:
    Attempted to compare integer 1 with non-integer:
    {}
    2199:0 2 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
