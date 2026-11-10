(*---
description: Evaluates a random seq expression, seed 262, number 2742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append((SubSeq(<<1>>, 0, -1) \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), LET b4330 == (3 + 2) IN Len(<<1, 2>>)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3, 2>>"
---*)
