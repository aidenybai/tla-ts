(*---
description: Evaluates a random int expression, seed 262, number 304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SubSeq(<<1, 2>>, {x \in 1..3 : x > 1}, 0)) - (CHOOSE b504 \in (3 .. 3) : (7 \in {}))) + Len(SelectSeq(Append(<<>>, 2147483647), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {2, 3}
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {2, 3}
---*)
