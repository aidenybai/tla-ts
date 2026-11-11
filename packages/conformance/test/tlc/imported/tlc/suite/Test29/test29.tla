(*---
description: Ported from TLC's Test29.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test29.java
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
--------------- MODULE test29  -------------

\* Testing proper evaluation of primed variables in action

EXTENDS TLC, Naturals, Sequences

VARIABLE x


Init == x = 2

Next == /\ x' = 2
        /\ x' > 1 
        /\ Print("Test 1 OK", TRUE)
        /\ 1..x' = {1,2}
        /\ Print("Test 2 OK", TRUE)
        /\ {i + 1 : i \in {x'}} = {3}
        /\ Print("Test 3 OK", TRUE)
        /\ {i \in {x'} : i = 2} = {2}
        /\ Print("Test 4 OK", TRUE)
        /\ \E i \in {x'} : i = 2
        /\ Print("Test 5 OK", TRUE)
        /\ \E i \in 1..x' : i < x'
        /\ Print("Test 6 OK", TRUE)



Inv ==  TRUE

=========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | "Test 1 OK"  TRUE
    | "Test 2 OK"  TRUE
    | "Test 3 OK"  TRUE
    | "Test 4 OK"  TRUE
    | "Test 5 OK"  TRUE
    | "Test 6 OK"  TRUE
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
