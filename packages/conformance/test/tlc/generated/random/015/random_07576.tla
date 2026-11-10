(*---
description: Evaluates a random function expression, seed 262, number 7576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11658 \in (({0, 7} \cup (1..3 \ {1})) \cap {(b11659 = b11659) : b11659 \in (2..1 \cup {1})}) |-> ((CHOOSE b11660 \in DOMAIN [x \in 1..2 |-> x] : (b11660 < <<>>)) - Cardinality({b11658, 2147483647}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07576 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    0
---*)
