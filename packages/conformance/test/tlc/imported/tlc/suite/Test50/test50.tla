(*---
description: Ported from TLC's Test50.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test50.java
features:
  - tlc-suite
outcome: success
config: "  INIT

  \    Init

  \ \ 

  \  NEXT

  \    Next

  \ \ 

  \  INVARIANT Inv




  \ "
---*)
--------------- MODULE test50 -------------

(* test usability of the following aliases with the standard modules:
   <=  and >=  of Naturals
   \circ of Sequences
   (+) and (-) of Bags 

*)


EXTENDS Naturals, Sequences, Bags, TLC

Bag1 == SetToBag({"a", "b"})
Bag2 == Bag1 \oplus  SetToBag({"a"}) \* causes TLC bug
Bag3 == Bag2 \ominus Bag1
Bag2a == Bag1 (+) SetToBag({"a"})
Bag3a == Bag2 (-) Bag1


VARIABLES x
Init == x = 0
Next == x'=x

Inv == 
       /\ IF Bag2 = Bag2a
            THEN Print("Test 1 OK", TRUE)
            ELSE Assert(FALSE, "Test 1 Failed") 

       /\ IF Bag3 = Bag3a
            THEN Print("Test 2 OK", TRUE)
            ELSE Assert(FALSE, "Test 2 Failed") 

       /\ IF <<"a">> \o <<"b">> = <<"a">> \circ <<"b">>
            THEN Print("Test 3 OK", TRUE)
            ELSE Assert(FALSE, "Test 3 Failed")  
    
       /\ IF 1 \leq 2
            THEN Print("Test 4 OK", TRUE)
            ELSE Assert(FALSE, "Test 4  Failed") 

       /\ IF 1 <= 2
            THEN Print("Test 5 OK", TRUE)
            ELSE Assert(FALSE, "Test 5  Failed") 
    
       /\ IF 2 \geq 1 
            THEN Print("Test 6 OK", TRUE)
            ELSE Assert(FALSE, "Test 6  Failed") 

       /\ IF 2 >= 1 
            THEN Print("Test 7 OK", TRUE)
            ELSE Assert(FALSE, "Test 7  Failed") 

=======================================

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
