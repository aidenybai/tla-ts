(*---
description: Ported from TLC's Test220.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test220.java
features:
  - tlc-suite
outcome: success
config: |2
    INIT
      Init
    
    NEXT
      Next

    CHECK_DEADLOCK FALSE

    INVARIANT Inv
---*)
--------------- MODULE test220  -------------

(* Testing deadlock and number of states found. *)

EXTENDS TLC, Naturals, Sequences, FiniteSets

ASSUME TLCGet("config").deadlock = FALSE

VARIABLE x, y, z

Init == /\ Print("This test should not deadlock when configured with CHECK_DEADLOCK=FALSE", TRUE)
        /\ x = {}
        /\ y = {}
        /\ z = 1

Next == /\ x = {}
        /\ x' = {1}        
        /\ y' \in SUBSET x'
        /\ z' = z
        /\ y' = {}

Inv ==  TRUE

=========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    | "This test should not deadlock when configured with CHECK_DEADLOCK=FALSE"  TRUE
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
