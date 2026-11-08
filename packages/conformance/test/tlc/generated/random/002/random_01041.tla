(*---
description: Evaluates a random seq expression, seed 262, number 1041.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01041 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Head(SubSeq(<<1, 2>>, 7, 1)), Len(Append(<<1, 2>>, -1))>>, Len(Append(SelectSeq(<<1>>, LAMBDA e : e > 0), (3 % 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01041 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
