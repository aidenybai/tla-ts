(*---
description: Evaluates a random function expression, seed 262, number 9686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq([<<3, 1, 2>> EXCEPT ![1] = <<>>], LAMBDA p, q : p < q)) :> LET b15024 == IF (FALSE /\ FALSE) THEN (1 + 3) ELSE (2 - 2147483647) IN (CHOOSE b15025 \in (1..3 \ {}) : ({2, 1, 3} \subseteq {x \in 1..3 : x > 1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    <<>>
    2266:0 The second argument of < should be an integer, but instead it is:
    <<>>
---*)
