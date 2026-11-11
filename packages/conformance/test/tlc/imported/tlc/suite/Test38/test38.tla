(*---
description: Ported from TLC's Test38.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test38.java
features:
  - tlc-suite
outcome: success
config: "  INIT

  \    Init

  \ \ 

  \  NEXT

  \    Next

  \ \ 

  \ CONSTANT c = c


  \ INVARIANT Inv






  \ "
includes:
  - test38a.tla
---*)
---------------------------- MODULE test38 -----------------------------

(* Test of EXTENDS *)

EXTENDS test38a, TLC

VARIABLES x
\* CONSTANT c

Init == MInit(x)
Next == x'=c
Inv  == IF (x=c) THEN Print("Test OK", TRUE)
                 ELSE Print("Test Failed", TRUE)


=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "Test OK"  TRUE
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
