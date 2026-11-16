(*---
description: Ported from TLC's LetDef2BoxedTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/LetDef2BoxedTest.java
features:
  - tlc-regression
outcome: liveness-violation
args:
  - -config
  - LetDef2Boxed.tla
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
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property x2 is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = TRUE
    2217:4 2: <Next line 18, col 9 to line 18, col 15 of module LetDef2Boxed>
    x = FALSE
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
