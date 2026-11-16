(*---
description: Evaluates a random function expression, seed 262, number 7483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b11533 \in {Cardinality(SUBSET {1}) : b11534 \in UNION {1..3, {1, 2}}} |-> (CHOOSE b11535 \in SortSeq(<<1, 2>>, LAMBDA p, q : p < q) : (1..3 = {1, 2}))] @@ (((CHOOSE b11536 \in 1..3 : 1) \div ((1 :> 2))[3]) :> CASE (-1 \in Nat) -> (3 - 1) [] OTHER -> (-1 - 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07483 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 94 to line 14, col 167 of module random_07483
---*)
