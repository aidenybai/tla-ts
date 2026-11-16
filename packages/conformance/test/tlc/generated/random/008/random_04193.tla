(*---
description: Evaluates a random set expression, seed 262, number 4193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(((b6599 .. 2) \cup (Nat \cap Nat))) : b6599 \in (((0 .. -1) \ UNION {Nat, {x \in 1..3 : x > 1}}) \ ((3 .. 2147483647) \cap (0 .. 1)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
