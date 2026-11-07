(*---
description: Evaluates a random seq expression, seed 262, number 4302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(SortSeq((<<1>> \o <<1>>), LAMBDA p, q : p < q), (Head(<<1>>) % (-7)), Len(Tail(<<>>))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -7
    2169:0 The second argument of % should be a positive number, but instead it is:
    -7
---*)
