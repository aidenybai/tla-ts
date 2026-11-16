(*---
description: Evaluates a random int expression, seed 262, number 5265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b8146 == ((CHOOSE r \in [a : 1..2] : TRUE)).a IN CASE (~FALSE) -> LET b8147 == b8146 IN b8146 [] OTHER -> (CHOOSE b8148 \in {} : FALSE) % [[a |-> Head(<<>>), b |-> (TRUE /\ TRUE)] EXCEPT !.a = Cardinality(DOMAIN [x \in 1..2 |-> x])]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
