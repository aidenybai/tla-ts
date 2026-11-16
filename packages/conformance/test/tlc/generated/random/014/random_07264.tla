(*---
description: Evaluates a random set expression, seed 262, number 7264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {UNION {2..1, 1..3}, {b11178 \in [x \in 1..2 |-> x] : TRUE}} \cap {b11179 \in (7 .. 1) : (b11179 < b11179)}) \ (({b11180 \in {} : TRUE} \ UNION {Nat, Nat}) \ (({1} \cup Nat) \cup (Nat \cap {1, 2})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
