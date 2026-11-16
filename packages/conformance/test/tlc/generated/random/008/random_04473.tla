(*---
description: Evaluates a random seq expression, seed 262, number 4473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)), LAMBDA e : e > 0), ((CHOOSE r \in [a : {1}] : TRUE)).a, Len(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), CASE FALSE -> -1 [] OTHER -> 0, (-2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
