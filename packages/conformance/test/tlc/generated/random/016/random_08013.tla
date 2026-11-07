(*---
description: Evaluates a random set expression, seed 262, number 8013.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08013 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 7], LAMBDA e : e > 0)) .. (-Head(SubSeq(<<3, 1, 2>>, 2147483647, -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
