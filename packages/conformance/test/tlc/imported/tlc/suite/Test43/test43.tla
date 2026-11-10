(*---
description: Ported from TLC's Test43.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test43.java
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
--------------- MODULE test43  -------------

(* Test of TLC module *)

EXTENDS TLC, Integers, Sequences

VARIABLE x

FApply(f, Op(_,_), Identity) ==
  LET fa[S \in SUBSET DOMAIN f] ==
        IF S = { } THEN Identity
                   ELSE LET s == CHOOSE s \in S : TRUE
                        IN  Op(f[s], fa[S \ {s}])
                            
  IN  fa[DOMAIN f]

BoundedSeq(S, n) == UNION {[1..i -> S] : i \in 0..n}
Plus(a, b) == a + b

Times(a, b) == a * b

Init == x = 1

Next ==  x' = x

Inv ==  

        /\ IF FApply([i \in {"a", "b", "c"} |-> 3], Times, 1) = 27
             THEN Print("Test 1 OK", TRUE)
             ELSE Assert(FALSE, "Test 1 Failed")

        /\ IF FApply(<<3, 4, 5, 6>> , Plus, 0) = 18
             THEN Print("Test 2 OK", TRUE)
             ELSE Assert(FALSE, "Test 2 Failed")
        
        /\ IF FApply(<<3>> , Plus, 0) = 3
             THEN Print("Test 3 OK", TRUE)
             ELSE Assert(FALSE, "Test 3 Failed")
        
        /\ IF FApply(<<>> , Plus, 7) = 7
             THEN Print("Test 4 OK", TRUE)
             ELSE Assert(FALSE, "Test 4 Failed")  

        /\ IF <<1, 2>> \in BoundedSeq(1..3, 3)
             THEN Print("Test 5 OK", TRUE)
             ELSE Assert(FALSE, "Test 5 Failed")

        /\ IF <<1, 2, 3>> \notin BoundedSeq(1..3, 2)
             THEN Print("Test 6 OK", TRUE)
             ELSE Assert(FALSE, "Test 6 Failed")         

        /\ IF <<-1, 2>> \notin BoundedSeq(1..4, 6)
             THEN Print("Test 7 OK", TRUE)
             ELSE Assert(FALSE, "Test 7 Failed")

        /\ IF << >> \in BoundedSeq({"a", "b"}, 2)
             THEN Print("Test 8 OK", TRUE)
             ELSE Assert(FALSE, "Test 8 Failed")

        /\ IF \A s \in BoundedSeq({"a", "b", "c"}, 2) :
                Len(s) \leq 2
             THEN Print("Test 9 OK", TRUE)
             ELSE Assert(FALSE, "Test 10 Failed")

        /\ IF SortSeq(<<3, 2, 4, 2>>, \leq) = <<2, 2, 3, 4>>
             THEN Print("Test 10 OK", TRUE)
             ELSE Assert(FALSE, "Test 12 Failed")

        /\ IF SortSeq(<<3, 2, 4, 2>>, <) = <<2, 2, 3, 4>>
             THEN Print("Test 11 OK", TRUE)
             ELSE Assert(FALSE, "Test 13 Failed")

        /\ IF SortSeq(<<>>, >) = <<>>
             THEN Print("Test 12 OK", TRUE)
             ELSE Assert(FALSE, "Test 14 Failed")

        /\ IF SortSeq(<<1>>, >) = <<1>>
             THEN Print("Test 13 OK", TRUE)
             ELSE Assert(FALSE, "Test 15 Failed")


Constraint == TRUE
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
