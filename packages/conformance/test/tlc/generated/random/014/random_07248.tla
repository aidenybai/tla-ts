(*---
description: Evaluates a random bool expression, seed 262, number 7248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((FALSE \/ FALSE) \/ ({x \in 1..3 : x > 1} = 3)) THEN ((CHOOSE b11147 \in {x \in 1..3 : x > 1} : TRUE) % (TRUE)[{x \in 1..3 : x > 1}]) ELSE ((2 - 2147483647) - (7 % 2147483647)) = Head([SubSeq(<<1>>, 2147483647, 7) EXCEPT ![1] = (-1 * 1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07248 failed.
    Attempted to check equality of the set {2, 3} with the value:
    3
---*)
