(*---
description: Ported from TLC's LetDef2BoxeddTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/LetDef2BoxeddTest.java
features:
  - tlc-regression
outcome: success
config: |
  \* Spec4 is the top-level equivalent of Spec3 (LET/IN).
  \* Exercises processConfigSpec without LetInNode.
  SPECIFICATION Spec4
args:
  - -deadlock
---*)
---- MODULE LetDef2Boxed ----
VARIABLE
    x
vars == x
x0 == x
Init == x = TRUE
Next == x' = ~x
Spec == Init /\ [][Next]_vars

x3(def_arg) == def_arg
Prop ==
    LET
        x1(x2(_)) == x2([][x']_x0)
    IN x1(x3)

-------

x2(def_arg) == def_arg
x1(def_arg(_)) == def_arg([][x']_x0)
Prop2 == x1(x2)

s1(sa(_)) == sa(Init /\ [][Next]_vars)

Spec3 ==
    LET
        id(a(_)) == a(Init /\ [][Next]_vars)
    IN id(x3)

Spec4 == s1(x3)

====
---- CONFIG LetDef2Boxed ----
SPECIFICATION Spec
PROPERTY Prop
====

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
