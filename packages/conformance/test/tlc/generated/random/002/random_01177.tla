(*---
description: Evaluates a random bool expression, seed 262, number 1177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head((<<3, 1, 2>> \o <<1, 2>>)) % LET b1889 == (CHOOSE b1890 \in {} : TRUE) IN ([x \in Nat |-> x + 1])[7]) = Cardinality(((3 .. -1) \ (SUBSET {1} \ {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
