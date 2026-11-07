(*---
description: Evaluates a random seq expression, seed 262, number 5671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o SortSeq(<<1>>, LAMBDA p, q : p < q)), {b8747 \in {2147483647, 0} : (TRUE \/ FALSE)}), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    {0, 2147483647}
    2266:0 The first argument of > should be an integer, but instead it is:
    {0, 2147483647}
---*)
