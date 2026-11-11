(*---
description: Evaluates a random set expression, seed 262, number 4946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SubSeq(<<3, 1, 2>>, 3, 2) EXCEPT !.a = @ + IF TRUE THEN 2147483647 ELSE -1] = (CHOOSE r \in [a : {1}] : TRUE)) .. Len(Tail(<<3, -1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04946 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
