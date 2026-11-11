(*---
description: Evaluates a random int expression, seed 262, number 7671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[(1 :> 2) EXCEPT ![2] = 1] EXCEPT ![SubSeq(<<>>, 1, 2)] = (-1 * 1)])[((1 * 2147483647) - (CHOOSE b11810 \in TRUE : FALSE))] \div (LET b11811 == Head(<<1, 2>>) IN (-1 % 0) * (-Head(Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 26 of module random_07671
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07671 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
