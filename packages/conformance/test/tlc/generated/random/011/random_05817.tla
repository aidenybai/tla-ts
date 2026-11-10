(*---
description: Evaluates a random record expression, seed 262, number 5817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-LET b8964 == Head(<<>>) IN Cardinality({2, 1, 3})), b |-> (LET b8965 == ([a |-> 1]).a IN (-1 \div b8965) .. (-Cardinality({2, 1, 3})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -3, b |-> {}]"
---*)
