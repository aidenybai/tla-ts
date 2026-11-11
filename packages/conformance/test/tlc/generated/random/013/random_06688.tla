(*---
description: Evaluates a random int expression, seed 262, number 6688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE) @@ [(1 :> 2) EXCEPT ![0] = 0]) => ([a |-> (1 :> 2), b |-> TRUE] = [a |-> 2, b |-> FALSE])) THEN Len(<<(0 * 2147483647), <<0, 2>>>>) ELSE ([b10257 \in {b10258 \in {x \in 1..3 : x > 1} : FALSE} |-> (0 + 1)])[(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 68 to line 14, col 73 of module random_06688
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06688 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 20 to line 14, col 151 of module random_06688
---*)
