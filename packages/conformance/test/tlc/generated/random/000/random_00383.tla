(*---
description: Evaluates a random seq expression, seed 262, number 383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(((<<1, 2>> \o <<3, 1, 2>>) \o SortSeq(<<>>, LAMBDA p, q : p < q))) EXCEPT ![1] = IF ((3 = 3) => (FALSE \/ FALSE)) THEN Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) ELSE LET b630 == Len(<<3, 1, 2>>) IN Head(<<>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
