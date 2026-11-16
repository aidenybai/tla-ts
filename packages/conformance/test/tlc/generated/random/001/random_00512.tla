(*---
description: Evaluates a random record expression, seed 262, number 512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality({b856 \in ({x \in 1..3 : x > 1} \cap {2, 1, 3}) : (TRUE \/ FALSE)}), b |-> ((([a |-> 1]).a \in {b857 \in {x \in 1..3 : x > 1} : FALSE}) \/ (LET b858 == 1 IN 2 < (-1 % 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00512 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
