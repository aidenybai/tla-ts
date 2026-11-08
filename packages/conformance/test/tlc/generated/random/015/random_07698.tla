(*---
description: Evaluates a random record expression, seed 262, number 7698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality({b11860 \in {0, 2147483647} : (~TRUE)}), b |-> (((2147483647 % -1) \in {b11861 : b11861 \in 1..3}) <=> (IF TRUE THEN <<1, 2>> ELSE 7 \in {b11862 \in {1, 2} : TRUE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07698 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
