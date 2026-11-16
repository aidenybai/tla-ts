(*---
description: Evaluates a random set expression, seed 262, number 9180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(({b14252 : b14253 \in 1..3} \ {b14254 \in SUBSET {1} : FALSE})) : b14252 \in (Cardinality(({} \cap Nat)) .. ((2 - 2147483647) + Head(<<3, 1, 2>>)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
