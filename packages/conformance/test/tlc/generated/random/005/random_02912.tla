(*---
description: Evaluates a random seq expression, seed 262, number 2912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(Tail(Tail(<<1>>)), LAMBDA p, q : p < q) EXCEPT ![1] = CASE ((TRUE /\ FALSE) /\ (FALSE /\ FALSE)) -> (CHOOSE b4608 \in DOMAIN [x \in Nat |-> x + 1] : (b4608 < 0)) [] OTHER -> Len(Tail(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
