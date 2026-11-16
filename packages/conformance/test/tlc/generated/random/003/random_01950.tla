(*---
description: Evaluates a random seq expression, seed 262, number 1950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SelectSeq(Append(<<1, 2>>, 0), LAMBDA e : e > 0) \o Append(SortSeq(<<1>>, LAMBDA p, q : p < q), CASE FALSE -> 2 [] OTHER -> 2147483647))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1, 2147483647>>"
---*)
