(*---
description: Ported from TLC's ETest6.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest6.java
features:
  - tlc-suite
outcome: evaluation-failure
config: "  INIT

  \    Init

  \ \ 

  \  NEXT

  \    Next

  \ \ 

  \  CONSTRAINT Constraint


  \  INVARIANT Inv




  \ "
---*)
--------------- MODULE etest6 -------------

(* Defining x' in terms of x' *)

EXTENDS TLC, Integers, Sequences, FiniteSets

VARIABLE x

Init == /\ Print("Should complain about undefined value of x.", TRUE)
        /\ x = [i \in {1,2} |-> i]


Action(c) == c' = [c EXCEPT ![1] = (c[2])']

Next ==  \/ /\ x[1] = 1
            /\ Action(x)
            /\ Print("Should not get this far", TRUE)

         \/ UNCHANGED x

Inv ==  TRUE
         

Constraint == TRUE
=========================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    | "Should complain about undefined value of x."  TRUE
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 44, col 23 to line 44, col 23 of module etest6
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 44, col 23 to line 44, col 23 of module etest6
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = <<1, 2>>
    | "Should complain about undefined value of x."  TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 43, column 13 to line 45, column 53 in etest6
    1. Line 43, column 16 to line 43, column 23 in etest6
    2. Line 44, column 16 to line 44, column 24 in etest6
    3. Line 41, column 14 to line 41, column 43 in etest6
    4. Line 41, column 19 to line 41, column 43 in etest6
    5. Line 41, column 36 to line 41, column 42 in etest6
    6. Line 41, column 37 to line 41, column 40 in etest6
    7. Line 41, column 37 to line 41, column 37 in etest6
    8. Line 44, column 23 to line 44, column 23 in etest6
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
