(*---
description: Ported from TLC's ETest3.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest3.java
features:
  - tlc-suite
outcome: deadlock
config: "  INIT

  \    Init

  \ \ 

  \  NEXT

  \    Next

  \ \ 

  \  INVARIANT Inv


  \ "
---*)
--------------- MODULE etest3  -------------

(* Testing deadlock and number of states found. *)

EXTENDS TLC, Naturals, Sequences, FiniteSets

VARIABLE x, y, z

Init == /\ Print("This test should deadlock after finding two states", TRUE)
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
  exit: 11
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    | "This test should deadlock after finding two states"  TRUE
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    | "This test should deadlock after finding two states"  TRUE
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = {}
    /\ y = {}
    /\ z = 1
    2217:4 2: <Next line 37, col 9 to line 41, col 18 of module etest3>
    /\ x = {1}
    /\ y = {}
    /\ z = 1
    | "This test should deadlock after finding two states"  TRUE
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
