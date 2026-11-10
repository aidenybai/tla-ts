(*---
description: Evaluates a random seq expression, seed 262, number 1269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail((SelectSeq(<<>>, LAMBDA e : e > 0) \o (<<1>> \o <<1>>))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
