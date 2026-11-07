(*---
description: Evaluates a random bool expression, seed 262, number 7354.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07354 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(7) - (1 \div 3)) = CASE (TRUE => FALSE) -> Len(<<1>>) [] OTHER -> Cardinality({1, 2})) <=> (Head(Tail(<<1>>)) % Len(SubSeq(<<3, 1, 2>>, 2, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    7
    2283:0 The argument of Len should be a sequence, but instead it is:
    7
---*)
