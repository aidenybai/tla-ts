(*---
description: Ported from TLC's LetDef1BoxedbTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/LetDef1BoxedbTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  \* Prop2 is the top-level equivalent of Prop (LET/IN).
  \* Exercises processConfigProps without LetInNode.
  SPECIFICATION Spec
  PROPERTY Prop2
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
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property x1 is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = TRUE
    2217:4 2: <Next line 21, col 9 to line 21, col 15 of module LetDef1Boxed>
    x = FALSE
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
