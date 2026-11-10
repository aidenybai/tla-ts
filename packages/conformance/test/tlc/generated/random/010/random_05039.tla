(*---
description: Evaluates a random set expression, seed 262, number 5039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7832 \in {(Head(<<1>>) + (b7833 - 3)) : b7833 \in (({x \in 1..3 : x > 1} \cap {}) \cap {-1 : b7834 \in 2..1})} : ([a |-> Cardinality([a |-> 1]), b |-> (-1 < 1)] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
