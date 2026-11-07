(*---
description: Ported from TLC's Github817eTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github817eTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
  PROPERTY PropParamIdState
args:
  - -deadlock
---*)
---------------------------- MODULE Github817 ---------------------------
VARIABLES x

Init == x = "init"
Next ==
    \/ x = "init" /\ x' = "in-progress"
    \/ x = "in-progress" /\ x' = "done"

AbstractX == IF x = "done" THEN "done" ELSE "in-progress"

Abstract == INSTANCE Abstract WITH
    x <- AbstractX

AbstractParam(n) == INSTANCE Abstract WITH
    x <- n

Spec ==
    /\ Init
    /\ [][Next]_x
    /\ WF_x(Next)


Refinement == Abstract!Spec
RefinementParam == AbstractParam(AbstractX)!Spec

op(b) == [][b]_x
PropParam == op(TRUE)               \* constant-level

\* Checking property PropParamRec causes a StackOverflow
RECURSIVE opRec(_)
opRec(b) == IF b THEN [][b]_x ELSE opRec(~b)
PropParamRec == opRec(TRUE)

PropParamF == op(FALSE)              \* constant-level

id(a) == a
TypeOK == x \in {"init", "in-progress", "done"}
PropParamIdState == id(TypeOK)       \* state-level

PropParamId == id(Refinement)        \* temporal-level

CheckBoth(safety, liveness) == safety /\ liveness
PropParamCheckBoth == CheckBoth(Refinement, op(TRUE))  \* both temporal-level

==========================================================================

----------------------------- MODULE Abstract ----------------------------
VARIABLES x
Super == INSTANCE Abstract2
Init == Super!Init
Next == Super!Next
Spec ==
    /\ Init
    /\ [][Next]_x
    /\ WF_x(Next)
==========================================================================

----------------------------- MODULE Abstract2 ---------------------------
VARIABLES x
Init == x = "in-progress"
Next == x' = "done"
Spec ==
    /\ Init
    /\ [][Next]_x
    /\ WF_x(Next)
==========================================================================

---------------------------- CONFIG Github817 ----------------------------
SPECIFICATION Spec
CHECK_DEADLOCK FALSE
PROPERTY Refinement PropParam
===========================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2255:3 The formula PropParamIdState is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula PropParamIdState holds in all states of every behavior, use INVARIANT PropParamIdState instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula PropParamIdState changes it into a temporal formula, asserting that PropParamIdState holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
