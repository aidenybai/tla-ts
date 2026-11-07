(*---
description: Evaluates a random seq expression, seed 262, number 3456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SortSeq([<<1, 2>> EXCEPT ![1] = 3], LAMBDA p, q : p < q) EXCEPT ![1] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a], SelectSeq(Append(SubSeq(<<>>, 2147483647, 7), CASE FALSE -> 2 [] OTHER -> 3), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, <<3>>>>"
---*)
