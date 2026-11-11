(*---
description: Evaluates a random bool expression, seed 262, number 9050.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14060 \in (({b14061 \in {1, 2} : TRUE} \cap (3 .. 2147483647)) \cap (UNION {1..3, {2, 1, 3}} \cup {b14062 \in {2, 1, 3} : FALSE})) : (\E b14063 \in ((0 * b14060) .. LET b14064 == b14060 IN b14064) : (Head(<<>>) = Cardinality({2, 1, 3})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
