(*---
description: Ported from TLC's Github819Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github819Test.java
features:
  - tlc-regression
outcome: evaluation-failure
args:
  - -config
  - Github819.tla
  - -deadlock
---*)
---------------------------- MODULE Github819 ---------------------------
EXTENDS Naturals
  
VARIABLES i

Init == i = 0
Next == i < 5 /\ i' = i + 1

Spec == Init /\ [][Next]_i

--------------------------
(*** Liveness ***)

TestFailing ==
  \A x \in {} :
    []<>TRUE

TestSucceeding ==
  \A x \in {42} :
    []<>TRUE

Live ==
  \* This condition causes liveness checking to fail with the error:
  \*  "Temporal formulas containing actions must be of forms <>[]A or []<>A."
  \* 
  \* If you comment this condition out, you'll see that liveness checking
  \* succeeds.
  /\ TestFailing

  \*/\ TestSucceeding
==========================================================================
---------------------------- CONFIG Github819 ----------------------------
SPECIFICATION Spec

PROPERTY Live
===========================================================================

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
