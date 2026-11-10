(*---
description: Evaluates a random seq expression, seed 262, number 5274.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05274 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(SortSeq(SubSeq(<<3, 1, 2>>, 2147483647, 0), LAMBDA p, q : p < q), Len(Append(<<>>, [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
