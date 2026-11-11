(*---
description: Evaluates a random seq expression, seed 262, number 6197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE r \in [a : 1..2] : TRUE)).a, ((IF TRUE THEN 7 ELSE 2 % ([x \in 1..2 |-> x])[1]) + Cardinality({b9543 : b9543 \in {}}))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 7>>"
---*)
