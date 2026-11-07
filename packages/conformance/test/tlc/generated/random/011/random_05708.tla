(*---
description: Evaluates a random set expression, seed 262, number 5708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b8782 \in (({2, 1, 3} \cap {2, 1, 3}) \cap {-1 : b8783 \in Nat}) : (\A b8784 \in DOMAIN (1 :> 2) : (\E b8785 \in {1, 2} : FALSE))) : b8781 \in Cardinality((DOMAIN [x \in 1..2 |-> x] \cup (3 .. 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05708 failed.
    TLC encountered a non-enumerable quantifier bound
    2.
    line 14, col 168 to line 14, col 221 of module random_05708
---*)
