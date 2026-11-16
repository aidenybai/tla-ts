(*---
description: Evaluates a random record expression, seed 262, number 3815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE (FALSE /\ FALSE) -> (2147483647 % 2147483647) [] OTHER -> CASE TRUE -> 2 [] OTHER -> 7 - (-(-1))), b |-> ((LET b6014 == 2147483647 IN b6014 = (3 * 0)) => ((1 + 3) = LET b6015 == -1 IN b6015))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> TRUE]"
---*)
