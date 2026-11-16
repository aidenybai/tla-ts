(*---
description: Evaluates a random seq expression, seed 262, number 2623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SelectSeq(Append(<<1>>, 3), LAMBDA e : e > 0) \o SortSeq(SubSeq(<<1, 2>>, 2, 2), LAMBDA p, q : p < q)), Len((Append(<<1, 2>>, 1) \o [<<1>> EXCEPT ![1] = 2]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 3, 2, 4>>"
---*)
