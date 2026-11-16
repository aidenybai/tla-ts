(*---
description: Evaluates a random set expression, seed 262, number 6250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (({1, 2} \cup 2..1) = [2..1 EXCEPT !.a = [x \in 1..2 |-> x]]) -> Len((<<3, 1, 2>> \o <<1>>)) [] OTHER -> Len((<<3, 1, 2>> \o <<>>)), (((CHOOSE b9629 \in {1, 2} : FALSE) \div LET b9630 == 1 IN b9630) * Cardinality((2 .. 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06250 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
