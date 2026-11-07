(*---
description: Evaluates a random record expression, seed 262, number 1683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> IF TRUE THEN 2 ELSE 1, b |-> {b2683 \in 2..1 : TRUE}] EXCEPT !.a = @ + CASE (2 \in 2..1) -> Cardinality({1}) [] OTHER -> IF FALSE THEN 2147483647 ELSE 3] EXCEPT !.a = @ + (CHOOSE b2684 \in ((1 % 2) .. (1 \div 0)) : (\A b2685 \in {b2686 \in {} : FALSE} : (\A b2687 \in {} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
