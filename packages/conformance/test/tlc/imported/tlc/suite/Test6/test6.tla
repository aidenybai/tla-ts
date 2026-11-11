(*---
description: Ported from TLC's Test6.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test6.java
features:
  - tlc-suite
outcome: success
config: |2+
    INIT
      Init
    
    NEXT
      Next
    
    INVARIANT Inv
---*)
--------------- MODULE test6 -------------

(* test of Propositional Logic. *)

EXTENDS Integers, TLC

VARIABLE x, y, z, w
Type == /\ x \in BOOLEAN
        /\ y \in BOOLEAN
        /\ z \in BOOLEAN
        /\ w = 0
Init == /\ x = TRUE
        /\ y = TRUE
        /\ z = FALSE
        /\ w = 0
Next ==  /\ \/ (w = 1) /\ Assert(FALSE, "This is a bug")
            \/ (w=0)
         /\ (w=0) \* \/ Assert(FALSE, "This is a bug, too")
                  \* Commented out because I now don't think it's a bug.
         /\ UNCHANGED <<w, x, y, z>>

Inv  ==  

  /\ IF ~(x /\ y /\ ~z)
      THEN Assert(FALSE, "Test 1 failed")
      ELSE Print("Test 1 OK", TRUE)
 
  /\ IF ~(~z /\ y)
      THEN Assert(FALSE, "Test 2 failed")
      ELSE Print("Test 2 OK", TRUE)

  /\ IF ~(x \/ ~y \/ z)
      THEN Assert(FALSE, "Test 3 failed")
      ELSE Print("Test 3 OK", TRUE)

  /\ IF ~(z \/ ~y \/ x)
      THEN Assert(FALSE, "Test 4 failed")
      ELSE Print("Test 4 OK", TRUE)

  /\ IF ~(x /\ y)
      THEN Assert(FALSE, "Test 5 failed")
      ELSE Print("Test 5 OK", TRUE)

  /\ IF (x /\ z)
      THEN Assert(FALSE, "Test 6 failed")
      ELSE Print("Test 6 OK", TRUE)

  /\ IF (z /\ x)
      THEN Assert(FALSE, "Test 7 failed")
      ELSE Print("Test 7 OK", TRUE)

  /\ IF (z /\ ~x)
      THEN Assert(FALSE, "Test 8 failed")
      ELSE Print("Test 8 OK", TRUE)

  /\ IF (z /\ (x=1))
      THEN Assert(FALSE, "Test 9 failed")
      ELSE Print("Test 9 OK", TRUE)

  /\ IF ~(x \/ (z=1))
      THEN Assert(FALSE, "Test 10 failed")
      ELSE Print("Test 10 OK", TRUE)

  /\ IF ~(x => y)
      THEN Assert(FALSE, "Test 11 failed")
      ELSE Print("Test 11 OK", TRUE)

  /\ IF ~(~x => y)
      THEN Assert(FALSE, "Test 12 failed")
      ELSE Print("Test 12 OK", TRUE)

  /\ IF ~(~x => z)
      THEN Assert(FALSE, "Test 13 failed")
      ELSE Print("Test 13 OK", TRUE)

  /\ IF (x => z)
      THEN Assert(FALSE, "Test 14 failed")
      ELSE Print("Test 14 OK", TRUE)

  /\ IF ~x
      THEN Assert(FALSE, "Test 15 failed")
      ELSE Print("Test 15 OK", TRUE)

  /\ IF ~~z
      THEN Assert(FALSE, "Test 16 failed")
      ELSE Print("Test 16 OK", TRUE)

  /\ IF ~(x <=> y)
      THEN Assert(FALSE, "Test 17 failed")
      ELSE Print("Test 17 OK", TRUE)

  /\ IF ~(~x <=> z)
      THEN Assert(FALSE, "Test 18 failed")
      ELSE Print("Test 18 OK", TRUE)

  /\ IF (x <=> z)
      THEN Assert(FALSE, "Test 19 failed")
      ELSE Print("Test 19 OK", TRUE)

  /\ IF (z <=> x)
      THEN Assert(FALSE, "Test 20 failed")
      ELSE Print("Test 20 OK", TRUE)

  /\ IF ~(x \equiv y)
      THEN Assert(FALSE, "Test 21 failed")
      ELSE Print("Test 21 OK", TRUE)

  /\ IF ~(~x \equiv z)
      THEN Assert(FALSE, "Test 22 failed")
      ELSE Print("Test 22 OK", TRUE)

  /\ IF (x \equiv z)
      THEN Assert(FALSE, "Test 23 failed")
      ELSE Print("Test 23 OK", TRUE)

  /\ IF (z \equiv x)
      THEN Assert(FALSE, "Test 24 failed")
      ELSE Print("Test 24 OK", TRUE)

  /\ IF TRUE \notin BOOLEAN
      THEN Assert(FALSE, "Test 25 failed")
      ELSE Print("Test 25 OK", TRUE)

  /\ IF FALSE \notin BOOLEAN
      THEN Assert(FALSE, "Test 26 failed")
      ELSE Print("Test 26 OK", TRUE)

  /\ IF {TRUE, FALSE} # BOOLEAN
      THEN Assert(FALSE, "Test 27 failed")
      ELSE Print("Test 27 OK", TRUE)

=========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "Test 1 OK"  TRUE
    | "Test 2 OK"  TRUE
    | "Test 3 OK"  TRUE
    | "Test 4 OK"  TRUE
    | "Test 5 OK"  TRUE
    | "Test 6 OK"  TRUE
    | "Test 7 OK"  TRUE
    | "Test 8 OK"  TRUE
    | "Test 9 OK"  TRUE
    | "Test 10 OK"  TRUE
    | "Test 11 OK"  TRUE
    | "Test 12 OK"  TRUE
    | "Test 13 OK"  TRUE
    | "Test 14 OK"  TRUE
    | "Test 15 OK"  TRUE
    | "Test 16 OK"  TRUE
    | "Test 17 OK"  TRUE
    | "Test 18 OK"  TRUE
    | "Test 19 OK"  TRUE
    | "Test 20 OK"  TRUE
    | "Test 21 OK"  TRUE
    | "Test 22 OK"  TRUE
    | "Test 23 OK"  TRUE
    | "Test 24 OK"  TRUE
    | "Test 25 OK"  TRUE
    | "Test 26 OK"  TRUE
    | "Test 27 OK"  TRUE
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
