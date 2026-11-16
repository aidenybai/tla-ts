(*---
description: Ported from TLC's ETest4.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest4.java
features:
  - tlc-suite
outcome: evaluation-failure
config: "  INIT

  \    Init

  \ \ 

  \  NEXT

  \    Next

  \ \ 

  \  INVARIANT Inv


  \  CONSTANT

  \    A = ModelValue

  \ "
---*)
--------------- MODULE etest4  -------------

(* Evaluates m[v] for model-value m. *)

EXTENDS TLC, Naturals, Sequences, FiniteSets

VARIABLE x
CONSTANT A



Req == [  mask |-> A  ]
Init == /\ x = 1
        /\ Print("Should report error for applying model value to arg", TRUE)
        /\ Req.mask[1] = 1
        /\ Print("Should never get this far", TRUE)

Next == UNCHANGED x

Inv ==  TRUE

=========================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    | "Should report error for applying model value to arg"  TRUE
    1000:1 A non-function (a model value) was applied as a function.
    line 42, col 12 to line 42, col 22 of module etest4
    | "Should report error for applying model value to arg"  TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 40, column 9 to line 43, column 51 in etest4
    1. Line 40, column 12 to line 40, column 16 in etest4
    2. Line 42, column 12 to line 42, column 26 in etest4
    3. Line 42, column 12 to line 42, column 22 in etest4
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
