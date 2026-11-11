(*---
description: Evaluates a random seq expression, seed 262, number 2714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(SortSeq(((1 :> 2))[3], LAMBDA p, q : p < q), LAMBDA e : e > 0) \o SubSeq([b4291 \in DOMAIN (1 :> 2) |-> CASE FALSE -> b4291 [] OTHER -> 1], ((CHOOSE f \in [1..2 -> 1..2] : TRUE))[LET b4292 == 1 IN 7], (Head(<<3, 1, 2>>) % Cardinality(Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02714 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
