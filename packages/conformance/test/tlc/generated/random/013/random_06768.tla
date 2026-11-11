(*---
description: Evaluates a random record expression, seed 262, number 6768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (1 \div 2147483647), b |-> (2147483647 = 2)] EXCEPT !.a = @ + (LET b10377 == 1 IN b10377 \div (2147483647 \div 7))] EXCEPT !.a = Len(<<(CHOOSE b10378 \in {2, 1, 3} : TRUE), (1 + -1)>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> FALSE]"
---*)
