(*---
description: Evaluates a random int expression, seed 262, number 1967.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01967 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b3112 \in ({2147483647, 0} \cap (2..1 \cap FALSE)) |-> Cardinality((<<3, 1, 2>> \cup {1, 2}))])[Head(((<<>> = <<>>) /\ (-1 < 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01967 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE
---*)
