(*---
description: Evaluates a random function expression, seed 262, number 8074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12477 \in (({{x \in 1..3 : x > 1}, 7} \ {b12478 \in {x \in 1..3 : x > 1} : TRUE}) \cap (({2, 1, 3} \cup {2, 1, 3}) \cap (-1 .. 0))) |-> ((Len(<<1>>) + LET b12479 == b12477 IN 3) - Cardinality({2 : b12480 \in {1}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08074 failed.
    Attempted to compare the set {2, 3} with the value:
    3
---*)
