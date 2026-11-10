(*---
description: Evaluates a random record expression, seed 262, number 6803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Cardinality({2, 1, 3}) \div Head(<<1>>)), b |-> (CASE TRUE -> 2 [] OTHER -> 3 \in <<2, 3>>)] EXCEPT !.a = @ + ([(CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) EXCEPT ![(-1 % 2)] = (0 - 7)])[Head((<<>> \o <<1>>))]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -4, b |-> 2]"
---*)
