(*---
description: Evaluates a random function expression, seed 262, number 3060.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03060 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(~TRUE)) \/ ((0 :> 1) = [[a |-> 1] EXCEPT !.a = 2])) \/ (SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) = ([<<5, 6>> EXCEPT ![2147483647] = 2147483647] @@ (FALSE @@ [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
