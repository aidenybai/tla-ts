(*---
description: Evaluates a random set expression, seed 262, number 6177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Append(<<1>>, 2147483647)) .. ((1 - 3) - Cardinality({1, 2}))) \cap {b9503 \in ((0 + 2) - (7 % 3)) : (([a |-> 1]).a \in {b9503 : b9504 \in {x \in 1..3 : x > 1}})}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
