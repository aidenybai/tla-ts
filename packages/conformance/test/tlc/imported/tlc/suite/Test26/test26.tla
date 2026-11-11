(*---
description: Ported from TLC's Test26.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test26.java
features:
  - tlc-suite
outcome: success
config: |
  INIT      Init
  NEXT      Next
  INVARIANT Inv
---*)
--------------- MODULE test26 -------------

(* Test of LET *)

EXTENDS TLC, Naturals, Sequences

VARIABLE x

Init ==  x = 0

FcnSubst(f, e(_)) ==
  (* A recursive definition of [i \in DOMAIN f |-> e(i)] *)
  LET Range == {f[i] : i \in DOMAIN f}
      FSet == UNION { [U -> Range] : U \in SUBSET DOMAIN f}
      FSub[g \in FSet] == 
        IF g = << >> 
          THEN g
          ELSE LET el == CHOOSE el \in DOMAIN g : TRUE
               IN  [ i \in DOMAIN g |-> 
                     IF i = el 
                      THEN e(i)
                      ELSE FSub[[j \in (DOMAIN g) \ {el} |-> f[j]]][i]]
  IN FSub[f]


Inv == 

  /\ LET A == {}
         B == A
     IN  IF B = {}
           THEN Print("Test 1 OK", TRUE)
           ELSE Assert(FALSE, "Test 1 Failed")

  /\ LET A == {}
         B == A
         C[i \in B] == 17
     IN  IF C = << >> 
           THEN Print("Test 2 OK", TRUE)
           ELSE Assert(FALSE, "Test 2 Failed")

  /\ LET e(i) == i+1
     IN  IF FcnSubst(<<1,2,3>>, e) = <<2,3,4>>
           THEN Print("Test 3 OK", TRUE)
           ELSE Assert(FALSE, "Test 3 Failed")
           
Next ==  UNCHANGED x
=========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "Test 1 OK"  TRUE
    | "Test 2 OK"  TRUE
    | "Test 3 OK"  TRUE
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
