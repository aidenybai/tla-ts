(*---
description: Ported from TLC's Test36.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test36.java
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
----------------------------- MODULE test36 --------------------------------

(* Test of standard Bags module *)

EXTENDS Naturals, TLC, Sequences, FiniteSets, Bags

Bag1 == SetToBag({"a", "b"})
Bag2 == Bag1 (+) SetToBag({"a"})

VARIABLES x
Init == x = 0
Next == x'=x

Inv ==
       /\ IF IsABag( Bag1 )
            THEN Print("Test 1 OK", TRUE)
            ELSE Assert(FALSE, "Test 1 Failed")

       /\ IF BagToSet(Bag2) = {"a", "b"}
            THEN Print("Test 2 OK", TRUE)
            ELSE Assert(FALSE, "Test 2 Failed")

       /\ IF BagIn("a", Bag2)
            THEN Print("Test 3 OK", TRUE)
            ELSE Assert(FALSE, "Test 3 Failed")

       /\ IF ~BagIn("c", Bag2)
            THEN Print("Test 4 OK", TRUE)
            ELSE Assert(FALSE, "Test 4 Failed")

       /\ IF BagToSet(EmptyBag) = {}
            THEN Print("Test 5 OK", TRUE)
            ELSE Assert(FALSE, "Test 5 Failed")

       /\ IF EmptyBag (+) Bag2 = Bag2
            THEN Print("Test 6 OK", TRUE)
            ELSE Assert(FALSE, "Test 6 Failed")

       /\ IF Bag2 (-) SetToBag({"a"}) = Bag1
            THEN Print("Test 7 OK", TRUE)
            ELSE Assert(FALSE, "Test 7 Failed")             

       /\ IF Bag1 (-) SetToBag({"a"}) = SetToBag({"b"})
            THEN Print("Test 8 OK", TRUE)
            ELSE Assert(FALSE, "Test 8 Failed")            

       /\ IF BagUnion({Bag1, Bag2}) = Bag1 (+) Bag2
            THEN Print("Test 9 OK", TRUE)
            ELSE Assert(FALSE, "Test 9 Failed")         

       /\ IF Bag1 \sqsubseteq Bag2
            THEN Print("Test 10 OK", TRUE)
            ELSE Assert(FALSE, "Test 10 Failed")   

       /\ Print("TLC Fails Tests 11 & 12 because SubBag not implemented", TRUE)
(*       /\ IF Bag1 \in SubBag(Bag2)
            THEN Print("Test 11 OK", TRUE)
            ELSE Assert(FALSE, "Test 11 Failed")

       /\ IF Cardinality(SubBag(Bag2)) = 6
            THEN Print("Test 12 OK", TRUE)
            ELSE Assert(FALSE, "Test 12 Failed")  *)

       /\ IF LET f(a) == <<"c", a>>
             IN  CopiesIn(<<"c", "a">>, BagOfAll(f, Bag2)) = 2
            THEN Print("Test 13 OK", TRUE)
            ELSE Assert(FALSE, "Test 13 Failed")  

       /\ IF BagCardinality(Bag2) = 3
            THEN Print("Test 14 OK", TRUE)
            ELSE Assert(FALSE, "Test 14 Failed")

       /\ IF CopiesIn("a", Bag2) = 2
            THEN Print("Test 15 OK", TRUE)
            ELSE Assert(FALSE, "Test 15 Failed")

       /\ IF CopiesIn("c", Bag2) = 0
            THEN Print("Test 16 OK", TRUE)
            ELSE Assert(FALSE, "Test 16 Failed")



=============================================================================

(* Last modified on Thu Aug 08 13:28:29 PT 2002 by lamport *)

 6 Apr 99 : Modified version for standard module set
 7 Dec 98 : Corrected error found by Stephan Merz.
 6 Dec 98 : Modified comments based on suggestions by Lyle Ramshaw.
 5 Dec 98 : Initial version.

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
    | "TLC Fails Tests 11 & 12 because SubBag not implemented"  TRUE
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
