(*---
description: Evaluates a random record expression, seed 262, number 3519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((3 + 1) + (CHOOSE b5559 \in Nat : FALSE)) * (Head(<<1, 2>>) * (CHOOSE b5560 \in Nat : TRUE))), b |-> (Len(Append(<<>>, 2147483647)) \in ((3 + 2147483647) .. Cardinality({1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03519 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 36 to line 14, col 63 of module random_03519
---*)
