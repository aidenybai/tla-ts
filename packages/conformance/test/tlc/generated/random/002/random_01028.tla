(*---
description: Evaluates a random function expression, seed 262, number 1028.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01028 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) .. (IF TRUE THEN 2 ELSE 0 + (0 - 3))) @@ (CHOOSE f \in [2..1 -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01028 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    1..2
---*)
