(*---
description: Evaluates a random record expression, seed 262, number 9895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \o SubSeq((<<1>> \o <<3, 1, 2>>), Head(<<3, 1, 2>>), Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09895 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
