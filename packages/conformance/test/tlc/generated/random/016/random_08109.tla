(*---
description: Evaluates a random bool expression, seed 262, number 8109.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08109 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(DOMAIN ((1 :> 2) @@ (1 :> 2)), LAMBDA e : e > 0) = [b12532 \in (Head(<<1>>) .. Cardinality(Nat)) |-> IF (TRUE <=> TRUE) THEN (CHOOSE b12533 \in {x \in 1..3 : x > 1} : TRUE) ELSE (b12532 - b12532)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1}
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1}
---*)
