(*---
description: Evaluates a random seq expression, seed 262, number 5504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(SortSeq(Append(<<1>>, 0), LAMBDA p, q : p < q), CASE (2..1 \subseteq SUBSET {1}) -> (0 * 2147483647) [] OTHER -> (-1 + 3)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
