(*---
description: Evaluates a random set expression, seed 262, number 152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b232 \in {((-1 % 1..3) * LET b234 == 3 IN b233) : b233 \in ({0 : b235 \in {}} \cap {1, 2147483647})} : ([[a |-> 3, b |-> FALSE] EXCEPT !.a = Cardinality(SUBSET {1})] = [a |-> (b232 < 2147483647), b |-> (FALSE => TRUE)])})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
