(*---
description: Evaluates a random seq expression, seed 262, number 44.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SortSeq(<<0, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), Cardinality(DOMAIN (7 :> -1))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1>>"
---*)
