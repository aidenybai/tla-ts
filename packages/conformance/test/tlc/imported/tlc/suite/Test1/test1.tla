(*---
description: Ported from TLC's Test1.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test1.java
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
--------------- MODULE test1 -------------

(* test equality of various representations of sets.    *)

EXTENDS Naturals, TLC

VARIABLE x


Type == x \in {1}
Inv  == 
 /\ IF {1, 2, 3} # {3, 2, 2, 1}
      THEN Assert(FALSE, "Failed Test 1")
      ELSE Print("Test 1 OK", TRUE)

 /\ IF  {1, 2, 3} # {i \in {5, 4, 3, 2, 1} : i < 4}
      THEN Assert(FALSE, "Failed Test 2")
      ELSE Print("Test 2 OK", TRUE)

 /\ IF {1, 2, 3} # {i-3 : i \in {4, 6, 5, 6, 5, 6}}
      THEN Assert(FALSE, "Failed Test 3")
      ELSE Print("Test 3 OK", TRUE)

 /\ IF SUBSET {1, 2, 3} # {{}, {1}, {2,1,2}, {3,1}, {2}, {3}, {3,2,3}, {1,2,3}}
      THEN Assert(FALSE, "Failed Test 4")
      ELSE Print("Test 4 OK", TRUE)

 /\ IF {1,2,3} # UNION (SUBSET {1, 2, 3})
      THEN Assert(FALSE, "Failed Test 5")
      ELSE Print("Test 5 OK", TRUE)    

 /\ IF {1,2,3} # UNION {{1}, {2}, {3, 2, 1}}
      THEN Assert(FALSE, "Failed Test 6")
      ELSE Print("Test 6 OK", TRUE)

 /\ IF {1,2,3} # {1} \cup {3, 2} \cup {}
      THEN Assert(FALSE, "Failed Test 7")
      ELSE Print("Test 7 OK", TRUE)

 /\ IF {1,2,3} # {5, 4, 3, 2, 1} \cap {1, 3, 0, 2}
      THEN Assert(FALSE, "Failed Test 8")
      ELSE Print("Test 8 OK", TRUE)

 /\ IF {1,2,3} \subseteq {5, 3, 3, 4, 2}
      THEN Assert(FALSE, "Failed Test 9")
      ELSE Print("Test 9 OK", TRUE)

 /\ IF {1,2,3} # {5, 3, 3, 4, 2,1} \ {4, 5}
      THEN Assert(FALSE, "Failed Test 10")
      ELSE Print("Test 10 OK", TRUE)

 /\ IF {1,2,3} # 1..3
      THEN Assert(FALSE, "Failed Test 11")
      ELSE Print("Test 11 OK", TRUE)

 /\ IF {1,2,3} # DOMAIN <<"a", "b", "c">>
      THEN Assert(FALSE, "Failed Test 12")
      ELSE Print("Test 12 OK", TRUE)

 /\ IF {1,2,3} # DOMAIN [i \in {3,2,2,1} |-> i+1]
      THEN Assert(FALSE, "Failed Test 13")
      ELSE Print("Test 13 OK", TRUE)

 /\ IF {"a", "b", "c"} # DOMAIN [a |-> 1, b |-> 2, c |-> 3]
      THEN Assert(FALSE, "Failed Test 14")
      ELSE Print("Test 14 OK", TRUE)

 /\ IF {} # [{1, 2, 3} -> {}]
      THEN Assert(FALSE, "Failed Test 15")
      ELSE Print("Test 15 OK", TRUE)

 /\ Print("Test Completed", TRUE)

Init == x = 1

Next == UNCHANGED x
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
    | "Test Completed"  TRUE
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
