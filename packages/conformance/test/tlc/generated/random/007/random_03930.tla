(*---
description: Evaluates a random seq expression, seed 262, number 3930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SortSeq(SubSeq(<<>>, 0, -1), LAMBDA p, q : p < q) \o Append(SortSeq(<<1>>, LAMBDA p, q : p < q), ([a |-> 1, b |-> TRUE]).a)) EXCEPT ![1] = ((IF FALSE THEN 2 ELSE 3 + (-7)) + LET b6194 == Head(<<1>>) IN (2 - 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-2, 1>>"
---*)
