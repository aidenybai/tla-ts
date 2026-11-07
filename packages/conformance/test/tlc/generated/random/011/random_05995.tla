(*---
description: Evaluates a random seq expression, seed 262, number 5995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq([Tail(<<>>) EXCEPT ![1] = IF TRUE THEN 2 ELSE 1], IF (<<3, 1, 2>> = [x \in 1..2 |-> x]) THEN (-7) ELSE (<<5, 6>>)[1], ((-1 % 1) - (<<5, 6>>)[7])) \o (SelectSeq(<<0, 0>>, LAMBDA e : e > 0) = ((2 :> 0) @@ [b9246 \in {} |-> b9246]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
