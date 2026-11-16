(*---
description: Evaluates a random seq expression, seed 262, number 923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<SubSeq((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o [<<1>> EXCEPT ![1] = 7]), Head(Tail(<<1, 2>>)), CASE (<<>> = [x \in 1..2 |-> x]) -> (2147483647 % 0) [] OTHER -> (CHOOSE b1487 \in Nat : TRUE)), (Len(SubSeq(<<3, 1, 2>>, 3, 2147483647)) * LET b1488 == (-1 - 1) IN Head(<<3, 1, 2>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00923 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 182 to line 14, col 208 of module random_00923
---*)
