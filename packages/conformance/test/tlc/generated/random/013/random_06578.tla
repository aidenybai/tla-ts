(*---
description: Evaluates a random seq expression, seed 262, number 6578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a) \o (((-3) < Len(<<>>)) /\ ((1 \div 2) \in {b10105 \in 2..1 : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06578 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
---*)
