(*---
description: Evaluates a random record expression, seed 262, number 621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (0 % -1), b |-> ({1, 2} = {})] EXCEPT !.a = (Cardinality(1..3) \div (CHOOSE b1041 \in {1} : FALSE))] EXCEPT !.a = @ + LET b1042 == (([x \in 1..2 |-> x])[-1] * IF TRUE THEN 1 ELSE 7) IN (-([x \in 1..2 |-> x])[b1042])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00621 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
