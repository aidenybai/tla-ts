(*---
description: Evaluates a random function expression, seed 262, number 4827.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04827 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b7531 \in {Len(<<1>>) : b7532 \in {b7533 : b7533 \in {1, 2}}} |-> ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a] @@ ((CHOOSE b7534 \in SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) : (b7534 < 7)) :> <<LET b7535 == 3 IN 0, CASE TRUE -> 0 [] OTHER -> 3>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04827 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 132 to line 14, col 203 of module random_04827
---*)
