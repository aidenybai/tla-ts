(*---
description: Evaluates a random bool expression, seed 262, number 458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(UNION {{1}, {2, 1, 3}} \subseteq UNION {2..1, 2..1})) <=> (~(\A b759 \in {2147483647, 2} : (\A b760 \in {x \in 1..3 : x > 1} : FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
