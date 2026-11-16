(*---
description: Evaluates a random record expression, seed 262, number 7203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = Len(<<1>>)] EXCEPT !.a = @ + LET b11069 == Cardinality(SUBSET {1}) IN (7 + b11069)] EXCEPT !.a = CASE ((2147483647 - 0) < (3 * 2)) -> (([x \in 1..2 |-> x] * 2147483647) % Cardinality({1})) [] OTHER -> ((1 + 3) % Head(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
