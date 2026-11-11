(*---
description: Evaluates a random seq expression, seed 262, number 3044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((Tail(Append(<<1, 2>>, <<>>)) \o Append(SelectSeq(<<>>, LAMBDA e : e > 0), (7 + 0))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03044 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    <<>>
---*)
