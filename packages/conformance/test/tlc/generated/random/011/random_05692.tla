(*---
description: Evaluates a random seq expression, seed 262, number 5692.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05692 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(Tail(<<>>), LAMBDA p, q : p < q), CASE (TRUE /\ FALSE) -> (0 + 2147483647) [] OTHER -> Head(<<1>>)) \o SelectSeq(Tail(Tail(<<1, 2>>)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
