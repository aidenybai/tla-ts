(*---
description: Evaluates a random function expression, seed 262, number 2400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3799 \in (DOMAIN [b3800 \in 2..1 |-> 3] \cap (UNION {{1}, {2, 1, 3}} \cup {b3801 \in {2, 1, 3} : TRUE})) |-> Head(SortSeq(SubSeq(<<3, 1, 2>>, 3, 2147483647), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
