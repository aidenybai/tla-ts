(*---
description: Ported from TLC's Test14.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test14.java
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
--------------- MODULE test14 -------------

(* Test of IF and CASE and nested junctions *)

EXTENDS Integers, TLC, FiniteSets, Sequences


VARIABLE x
Type == x \in BOOLEAN
Init == x = TRUE
Next == UNCHANGED x

Inv  ==  

  /\ IF (IF TRUE THEN IF FALSE THEN 3 ELSE 2 ELSE 1) # 2
       THEN Assert(FALSE, "Test 1 Failed")
       ELSE Print("Test 1 OK", TRUE)

  /\ IF (CASE FALSE -> 1 [] TRUE -> CASE FALSE -> 2 [] TRUE -> 3 [] OTHER -> 4)
          # 3
       THEN Assert(FALSE, "Test 2 Failed")
       ELSE Print("Test 2 OK", TRUE)

  /\ IF (CASE FALSE -> 1 [] FALSE -> CASE FALSE -> 2 [] TRUE -> 3 
               [] OTHER -> 4 [] TRUE -> 5) # 5
       THEN Assert(FALSE, "Test 3 Failed")
       ELSE Print("Test 3 OK", TRUE)

  /\ IF (CASE FALSE -> 1 [] TRUE -> CASE FALSE -> 2 [] FALSE -> 3 
          [] OTHER -> 4 [] TRUE -> 5) # 4
       THEN Assert(FALSE, "Test 4 Failed")
       ELSE Print("Test 4 OK", TRUE)

  /\ IF (CASE FALSE -> 1 [] FALSE -> CASE TRUE -> 2 [] TRUE -> 3 
                 [] OTHER -> 4 [] OTHER -> 5) # 5
       THEN Assert(FALSE, "Test 5 Failed")
       ELSE Print("Test 5 OK", TRUE)

  /\ IF (CASE TRUE -> 1 [] TRUE -> CASE TRUE -> 2 [] TRUE -> 3 
            [] OTHER -> 4 [] OTHER -> 5) \notin {1, 2, 3}
       THEN Assert(FALSE, "Test 6 Failed")
       ELSE Print("Test 6 OK", TRUE)

  /\ IF  ~ \/ /\ 1=3
              /\ "a" = 1
           \/ /\ 1 = 2
              /\ "b" = 1
           \/ /\ 1 = 1
              /\ 2 = 2
           \/ "c" = 1
       THEN Assert(FALSE, "Test 7 Failed")
       ELSE Print("Test 7 OK", TRUE)

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
