(*---
description: Ported from TLC's LetDef1BoxedcTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/LetDef1BoxedcTest.java
features:
  - tlc-regression
outcome: success
config: |
  \* Spec3 wraps Init /\ [][Next]_vars through a LET-defined identity.
  \* Exercises processConfigSpec with LetInNode.
  SPECIFICATION Spec3
args:
  - -deadlock
---*)
--------------------------- MODULE LetDef1Boxed ----------------------------
VARIABLE
    x
vars == x
x0 == x
Init == x = TRUE
Next == x' = ~x
Spec == Init /\ [][Next]_vars

Prop ==
    LET
        x1(x2) == x2
    IN x1([][x']_x0)

-----

x1(def_arg) == def_arg

Prop2 == x1([][x']_x0)

Spec3 ==
    LET
        id(a) == a
    IN id(Init /\ [][Next]_vars)

Spec4 == x1(Init /\ [][Next]_vars)
===========================================================================
---- CONFIG LetDef1Boxed ----
SPECIFICATION Spec
PROPERTY Prop
======

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
