(*---
description: Evaluates a random seq expression, seed 262, number 7169.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07169 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SelectSeq(Append(<<1, 2>>, 3), LAMBDA e : e > 0) EXCEPT ![1] = CASE (FALSE => TRUE) -> Cardinality(1..3) [] OTHER -> Cardinality(1..3)] \o SelectSeq((SortSeq(<<>>, LAMBDA p, q : p < q) \o SortSeq(<<>>, LAMBDA p, q : p < q)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 2, 3>>"
---*)
