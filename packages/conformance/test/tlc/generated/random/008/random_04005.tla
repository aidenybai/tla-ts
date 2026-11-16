(*---
description: Evaluates a random record expression, seed 262, number 4005.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + CASE ((1 \div 7) = (-1 + -1)) -> Cardinality(({x \in 1..3 : x > 1} \ {1, 2})) [] OTHER -> CASE (\A b6293 \in {2, 1, 3} : FALSE) -> Cardinality({1}) [] OTHER -> Head(<<1>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
