(*---
description: Evaluates a random function expression, seed 262, number 5701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(Tail(<<1>>))) :> Head(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), IF TRUE THEN 2147483647 ELSE 7, IF FALSE THEN 0 ELSE [a |-> 1, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
