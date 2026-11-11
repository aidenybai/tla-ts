(*---
description: Evaluates a random seq expression, seed 262, number 8573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail(Append(<<>>, 1)) \o SubSeq(CASE FALSE -> 0 [] OTHER -> -1, Len(<<1>>), Len(<<3, 1, 2>>))) \o Tail(Tail(Cardinality({1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08573 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    -1
---*)
