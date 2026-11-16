(*---
description: Evaluates a random bool expression, seed 262, number 9605.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09605 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(({1, 2} \cup {1})) .. CASE ([x \in 1..2 |-> x] => FALSE) -> IF {2, 1, 3} THEN 1 ELSE 2147483647 [] OTHER -> Len(<<>>)) \subseteq UNION {({b14913 : b14913 \in {1}} \ {2, 0}), ((Nat \cap {1}) \cap ({1, 2} \cap {1}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09605 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 58 to line 14, col 84 of module random_09605
---*)
