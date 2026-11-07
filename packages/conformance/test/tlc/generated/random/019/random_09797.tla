(*---
description: Evaluates a random int expression, seed 262, number 9797.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09797 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq([<<1, 2>> EXCEPT ![1] = 1], Len(<<3, 1, 2>>), Len(<<>>))) % Head(SelectSeq((\E b15201 \in {x \in 1..3 : x > 1} : TRUE), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
