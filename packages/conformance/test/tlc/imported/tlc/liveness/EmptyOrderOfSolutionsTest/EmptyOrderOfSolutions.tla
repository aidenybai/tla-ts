(*---
description: Ported from TLC's EmptyOrderOfSolutionsTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/EmptyOrderOfSolutionsTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |
  SPECIFICATION
  Spec
  PROPERTY
  Prop
args:
  - -deadlock
---*)
----- MODULE EmptyOrderOfSolutions -----
VARIABLES x

Init == x = 0

Next == x' = 1

Spec == Init /\ [][Next]_x

Prop == <>[]TRUE => TRUE
=====

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
