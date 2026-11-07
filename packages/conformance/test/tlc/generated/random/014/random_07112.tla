(*---
description: Evaluates a random seq expression, seed 262, number 7112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Tail(Tail(<<1>>)), Len(<<2, 3>>)) \o SelectSeq(Append(Append(<<1, 2>>, -1), ([a |-> 1]).a), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
