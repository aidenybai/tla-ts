(*---
description: Evaluates a random record expression, seed 262, number 1756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((IF TRUE THEN 7 ELSE 2147483647 \in {b2793 : b2793 \in 1..3}) => (Head((1 :> 2)) \in DOMAIN [x \in Nat |-> x + 1])) EXCEPT !.a = @ + Cardinality((CHOOSE r \in [a : {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01756 failed.
    Attempted to evaluate an expression of form P => Q when P was
    an integer.
    line 14, col 18 to line 14, col 131 of module random_01756
---*)
