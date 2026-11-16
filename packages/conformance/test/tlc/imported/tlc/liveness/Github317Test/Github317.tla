(*---
description: Ported from TLC's Github317Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github317Test.java
features:
  - tlc-regression
outcome: tlc-error
args:
  - -config
  - Github317.tla
  - -deadlock
---*)
-------------------------------- MODULE Github317 --------------------------------
EXTENDS Naturals

VARIABLES a, b
vars == <<a,b>>

Init == /\ a = 0
        /\ b = 0
        
disj == /\ a' = a + 1
        /\ a' \in 1..10

Next == /\ disj
        /\ UNCHANGED b \* Moving UNCHANGED b to disj makes bug disappear (see WF_vars(...) below).

Spec == /\ Init
        /\ [][Next]_vars
        /\ WF_vars(disj) \* disj does not define b, yet vars includes b.

Inv == ENABLED disj

Prop == <>FALSE \* Force TLC to run liveness checking.

=============================================================================
---- CONFIG Github317 ----
SPECIFICATION Spec
PROPERTY Prop
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 29, column 20 to line 29, column 23 in Github317
    1. Line 21, column 9 to line 22, column 23 in Github317
    2. Line 21, column 12 to line 21, column 21 in Github317
    3. Line 22, column 12 to line 22, column 23 in Github317
    4. Line 29, column 15 to line 29, column 18 in Github317
    5. Line 16, column 9 to line 16, column 15 in Github317
    6. Line 16, column 13 to line 16, column 13 in Github317
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2148:0 The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable b occurring in the state formula v.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ a = 0
    /\ b = 0
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
