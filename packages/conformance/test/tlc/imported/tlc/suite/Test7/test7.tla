(*---
description: Ported from TLC's Test7.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test7.java
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
--------------- MODULE test7 -------------

(* test of Predicate Logic and CHOOSE *)

EXTENDS Integers, TLC

VARIABLE x
Type == x \in BOOLEAN
Init == x = TRUE
Next == UNCHANGED x

Inv  ==  

  /\ IF ~ \E i \in {1,2,3} : i=2
       THEN Assert(FALSE, "Test 1 Failed")
       ELSE Print("Test 1 OK", TRUE)

  /\ IF ~ \exists i \in {1,2,3} : i=2
       THEN Assert(FALSE, "Test 1a Failed")
       ELSE Print("Test 1a OK", TRUE)

  /\ IF \A i \in {3,3,3,3,2,1} : i=3
       THEN Assert(FALSE, "Test 2 Failed")
       ELSE Print("Test 2 OK", TRUE)

  /\ IF \forall i \in {3,3,3,3,2,1} : i=3
       THEN Assert(FALSE, "Test 2a Failed")
       ELSE Print("Test 2a OK", TRUE)

  /\ IF \E i \in {1,2,3} : FALSE
       THEN Assert(FALSE, "Test 3 Failed")
       ELSE Print("Test 3 OK", TRUE)

  /\ IF ~\A i \in {1,2,3} : TRUE
       THEN Assert(FALSE, "Test 4 Failed")
       ELSE Print("Test 4 OK", TRUE)

  /\ IF \E i \in {} : TRUE
       THEN Assert(FALSE, "Test 5 Failed")
       ELSE Print("Test 5 OK", TRUE)

  /\ IF \exists i \in {} : TRUE
       THEN Assert(FALSE, "Test 5a Failed")
       ELSE Print("Test 5a OK", TRUE)

  /\ IF ~\A i \in {} : FALSE
       THEN Assert(FALSE, "Test 6 Failed")
       ELSE Print("Test 6 OK", TRUE)

  /\ IF ~\forall i \in {} : FALSE
       THEN Assert(FALSE, "Test 6a Failed")
       ELSE Print("Test 6a OK", TRUE)

  /\ IF ~\E <<i, j>> \in {1,2} \X {3,4}, 
             k, l \in {4, 5}, m \in {6,7} : i + j + k + l + m = 23
       THEN Assert(FALSE, "Test 7 Failed")
       ELSE Print("Test 7 OK", TRUE)

  /\ IF ~\A <<i, j>> \in {1,2} \X {3,4}, 
        k, l \in {4, 5}, m \in {6,7} : i + j + k + l + m > 17
       THEN Assert(FALSE, "Test 8 Failed")
       ELSE Print("Test 8 OK", TRUE)

  /\ IF (CHOOSE i \in {1,2,3} : i > 2) # 3
       THEN Assert(FALSE, "Test 9 Failed")
       ELSE Print("Test 9 OK", TRUE)

  /\ IF (CHOOSE i \in {1,2,3, 4} : i > 2) \leq 2
       THEN Assert(FALSE, "Test 10 Failed")
       ELSE Print("Test 10 OK", TRUE)

  /\ IF <<1, 3>> # CHOOSE <<i, j>> \in {1,2} \X {3,4} : (i < 2) /\ (j = i+2)
       THEN Assert(FALSE, "Test 11 Failed")
       ELSE Print("Test 11 OK", TRUE)

  /\ IF ~(\A i \in {1,2}, <<j, k>> \in {3,4} \X {5, 6}, m, n \in {7,8} :
            i+j+k+m+n \geq 23)
       THEN Assert(FALSE, "Test 12 Failed")
       ELSE Print("Test 12 OK", TRUE)

  /\ IF \E i \in {1,2}, <<j, k>> \in {3,4} \X {5, 6}, m, n \in {7,8} :
            i+j+k+m+n < 23
       THEN Assert(FALSE, "Test 13 Failed")
       ELSE Print("Test 13 OK", TRUE)


  /\ IF \A i \in CHOOSE j \in {{Nat}, {Int}} : \E k \in j : -1 \in k :
           -4 \in i
       THEN Print("Test 14 OK", TRUE)
       ELSE Assert(FALSE, "Test 14 Failed")
=========================================

The following test is not expected to work because
TLC does not preserve the semantics of CHOOSE

  /\ IF (CHOOSE i \in {1,2,3, 4} : i > 2) 
           # (CHOOSE i \in {4, 1, 3 , 2} : i > 2) 
       THEN Assert(FALSE, "Test 11 Failed")
       ELSE Print("Test 11 OK", TRUE)

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "Test 1 OK"  TRUE
    | "Test 1a OK"  TRUE
    | "Test 2 OK"  TRUE
    | "Test 2a OK"  TRUE
    | "Test 3 OK"  TRUE
    | "Test 4 OK"  TRUE
    | "Test 5 OK"  TRUE
    | "Test 5a OK"  TRUE
    | "Test 6 OK"  TRUE
    | "Test 6a OK"  TRUE
    | "Test 7 OK"  TRUE
    | "Test 8 OK"  TRUE
    | "Test 9 OK"  TRUE
    | "Test 10 OK"  TRUE
    | "Test 11 OK"  TRUE
    | "Test 12 OK"  TRUE
    | "Test 13 OK"  TRUE
    | "Test 14 OK"  TRUE
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
