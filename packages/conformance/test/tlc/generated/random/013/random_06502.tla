(*---
description: Evaluates a random function expression, seed 262, number 6502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE [x \in 1..2 |-> x] -> 7 [] OTHER -> 2147483647 % (CHOOSE b9997 \in {} : TRUE)) + [((1 :> 2) @@ [x \in Nat |-> x + 1]) EXCEPT ![[a |-> -1, b |-> TRUE]] = (0 \div 2)]) :> (((0 % 2) \div Head(<<1>>)) * Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06502 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as a condition of a CASE. line 14, col 24 to line 14, col 41 of module random_06502
---*)
