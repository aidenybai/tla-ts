(*---
description: Evaluates a random record expression, seed 262, number 3876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (TRUE /\ FALSE) THEN Head(<<3, 1, 2>>) ELSE (0 \div 1), b |-> (LET b6101 == 2147483647 IN 1 < ([a |-> 1, b |-> TRUE]).a)] EXCEPT !.a = @ + (Len(Append(<<>>, -1)) - ((2147483647 - 7) \div IF FALSE THEN 1 ELSE 3))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -715827879, b |-> FALSE]"
---*)
