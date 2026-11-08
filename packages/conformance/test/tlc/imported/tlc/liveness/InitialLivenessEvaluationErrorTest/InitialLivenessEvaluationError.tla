(*---
description: Ported from TLC's InitialLivenessEvaluationErrorTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/InitialLivenessEvaluationErrorTest.java
features:
  - tlc-regression
outcome: config-error
config: |
  SPECIFICATION Spec
  INVARIANT Inv
  PROPERTY Prop
args:
  - -deadlock
---*)
-------------------- MODULE InitialLivenessEvaluationError --------------------
EXTENDS Naturals

VARIABLE x

Init == x = 0
Next == (x = 0 /\ x' = 1) \/ UNCHANGED x
Spec == Init /\ [][Next]_x

Inv == x = 0

Prop == <>~ENABLED (x' > x)

=============================================================================

(*--- recorded
all:
  exit: 151
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2102:1 While working on the initial state:
    x = 0
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 25, col 21 to line 25, col 21 of module InitialLivenessEvaluationError
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
