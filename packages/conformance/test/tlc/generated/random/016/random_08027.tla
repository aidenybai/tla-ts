(*---
description: Evaluates a random set expression, seed 262, number 8027.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08027 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality({(-1 - -1) : b12385 \in ({} \ {1})}) : b12384 \in UNION {({b12386 \in {1} : TRUE} \cap UNION {2..1, {1}}), {([a |-> 1, b |-> TRUE]).a : b12387 \in {b12388 : b12388 \in {1, 2}}}}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0}"
---*)
