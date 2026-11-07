(*---
description: Ported from TLC's Test15.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test15.java
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
--------------- MODULE test15 -------------
(* Test of handling the empty set *)

EXTENDS TLC, Naturals, Sequences

VARIABLE x
Type == x \in BOOLEAN
Init == x = TRUE
Next == UNCHANGED x



Inv ==  
  /\ IF SUBSET {} # {{}}
       THEN Assert(FALSE, "Test 1 Failed")
       ELSE Print("Test 1 OK", TRUE)

  /\ IF UNION {} # {}
       THEN Assert(FALSE, "Test 2 Failed")
       ELSE Print("Test 2 OK", TRUE)

  /\ IF {y \in {} : y = y} # {}
       THEN Assert(FALSE, "Test 3 Failed")
       ELSE Print("Test 3 OK", TRUE)

  /\ IF [y \in {} |-> y] # << >>
       THEN Assert(FALSE, "Test 4 Failed")
       ELSE Print("Test 4 OK", TRUE)

  /\ IF (\E S \in {} : TRUE) # FALSE
       THEN Assert(FALSE, "Test 5 Failed")
       ELSE Print("Test 5 OK", TRUE)

  /\ IF (\A S \in {} : FALSE) # TRUE
       THEN Assert(FALSE, "Test 6 Failed")
       ELSE Print("Test 6 OK", TRUE)

  /\ IF DOMAIN <<>> # {}
       THEN Assert(FALSE, "Test 7 Failed")
       ELSE Print("Test 7 OK", TRUE)

  /\ IF 1..0 # {}
       THEN Assert(FALSE, "Test 8 Failed")
       ELSE Print("Test 8 OK", TRUE)

  /\ IF <<>> \notin Seq({})
       THEN Assert(FALSE, "Test 9 Failed")
       ELSE Print("Test 9 OK", TRUE)

  /\ IF <<{}>> \in Seq ({})
       THEN Assert(FALSE, "Test 10 Failed")
       ELSE Print("Test 10 OK", TRUE)

  /\ IF \E S \in SUBSET {} : S # {}
       THEN Assert(FALSE, "Test 11 Failed")
       ELSE Print("Test 11 OK", TRUE)
  /\ IF [{} -> {1, 2, 3}] # {<<>>}
       THEN Assert(FALSE, "Test 12 Failed")
       ELSE Print("Test 12 OK", TRUE)

  /\ IF [{1, 2, 3} -> {}] # {}
       THEN Assert(FALSE, "Test 13 Failed")
       ELSE Print("Test 13 OK", TRUE)


  /\ IF (UNION {{1,2,3}, {}}) # (UNION {{1,2,3}}) 
       THEN Assert(FALSE, "Test 14 Failed")
       ELSE Print("Test 14 OK", TRUE)

  /\ IF 1..0 # {}
       THEN Assert(FALSE, "Test 15 Failed")
       ELSE Print("Test 15 OK", TRUE)

  /\ IF 1..0 # 5..2
       THEN Assert(FALSE, "Test 16 Failed")
       ELSE Print("Test 16 OK", TRUE)

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
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
