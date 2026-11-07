(*---
description: Evaluates a random record expression, seed 262, number 6745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((<<(3 .. 2), ([a |-> 1]).a>> \o SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    {}
    2266:0 The first argument of > should be an integer, but instead it is:
    {}
---*)
