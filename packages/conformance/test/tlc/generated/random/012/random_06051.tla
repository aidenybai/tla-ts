(*---
description: Evaluates a random seq expression, seed 262, number 6051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((IF (TRUE \/ FALSE) THEN ([a |-> 1]).a ELSE ([a |-> 1]).a \o (SubSeq(<<1>>, 2, 0) \o SubSeq(<<3, 1, 2>>, 2147483647, 2))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    1
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    1
---*)
