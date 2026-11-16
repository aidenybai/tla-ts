(*---
description: Ported from TLC's Test13.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test13.java
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
--------------- MODULE test13 -------------

(* Test of Tuples and Cartesian products. *)

EXTENDS Integers, TLC, FiniteSets, Sequences


VARIABLE x
Type == x \in BOOLEAN
Init == x = TRUE
Next == UNCHANGED x

Inv  ==  
LET S1 == {1,2,3} \X {"a", "b", "c", "d"}
    S2 == Int \X [{1,2,3} -> {4, 5, 6}]
    S3 == {1,2,3} \X {"a", "b", "c", "d"} \X {4,5}
    S4 == Int \X [{1,2,3} -> {4, 5, 6}] \X Seq(Int)

IN
  /\ IF Cardinality(S1) # 12 \/ Cardinality(S3) # 24
       THEN Assert(FALSE, "Test 1 Failed")
       ELSE Print("Test 1 OK", TRUE)

  /\ IF \/ <<-5, <<4,4,4>> >> \notin S2
        \/ <<-5, <<4,4,4>>, <<-1,-2,-3>> >>  \notin S4
       THEN Assert(FALSE, "Test 2 Failed")
       ELSE Print("Test 2 OK", TRUE)

  /\ IF <<-5, -4>> \notin Int \X Int
       THEN Assert(FALSE, "Test 3 Failed")
       ELSE Print("Test 3 OK", TRUE)

  /\ IF <<-5, <<4,4,3>>>> \in S2
       THEN Assert(FALSE, "Test 4 Failed")
       ELSE Print("Test 4 OK", TRUE)

  /\ IF {<<"a", "b", "c">>[i] : i \in 1..3} 
          # DOMAIN [a |-> 1, b |-> 2, c |-> {}]
       THEN Assert(FALSE, "Test 5 Failed")
       ELSE Print("Test 5 OK", TRUE)

  /\ IF [i \in {1, 2} |-> IF i = 1 THEN "a" ELSE 22] # <<"a", 22>>
       THEN Assert(FALSE, "Test 6 Failed")
       ELSE Print("Test 6 OK", TRUE)

  /\ IF [i \in {1, 2} |-> IF i = 1 THEN "a" ELSE 22] =  <<"a", 23>>
       THEN Assert(FALSE, "Test 7 Failed")
       ELSE Print("Test 7 OK", TRUE)

  /\ IF <<1,2>> \notin Seq(Int)
       THEN Assert(FALSE, "Test 8 Failed")
       ELSE Print("Test 8 OK", TRUE)

  /\ IF <<1,2>> \notin Seq({n \in Int : n < 22})
       THEN Assert(FALSE, "Test 9 Failed")
       ELSE Print("Test 9 OK", TRUE)

  /\ IF <<1,2>> \in Seq({n \in Int : n > 22})
       THEN Assert(FALSE, "Test 9 Failed")
       ELSE Print("Test 9 OK", TRUE)

  /\ IF <<-5, -4, -3>> \notin Int \X Int \X Int
       THEN Assert(FALSE, "Test 10 Failed")
       ELSE Print("Test 10 OK", TRUE)

  /\ IF <<-5, <<4,4,3>>, <<1,-1>> >> \in S4
       THEN Assert(FALSE, "Test 11 Failed")
       ELSE Print("Test 11 OK", TRUE)

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
    | "Test 9 OK"  TRUE
    | "Test 10 OK"  TRUE
    | "Test 11 OK"  TRUE
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
