(*---
description: Evaluates a random function expression, seed 262, number 385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b631 \in ({IF TRUE THEN [a |-> 1, b |-> TRUE] ELSE b632 : b632 \in {3 : b633 \in {}}} \cap (UNION {{2, 1, 3}, {2, 1, 3}} \cup {2147483647, 3})) |-> ((Len(<<1, 2>>) \div (FALSE + 2147483647)) - LET b634 == (CHOOSE b635 \in 2..1 : TRUE) IN (b631 \div b634))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
