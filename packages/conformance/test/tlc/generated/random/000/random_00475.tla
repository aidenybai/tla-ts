(*---
description: Evaluates a random int expression, seed 262, number 475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq([<<1>> EXCEPT ![1] = -1], LAMBDA e : e > 0)) % Head(SubSeq((<<1>> \o <<1, 2>>), (3 \div 0), (-2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
