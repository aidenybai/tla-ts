(*---
description: Evaluates a random function expression, seed 262, number 7245.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07245 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE) @@ [b11143 \in {b11144 \in UNION {1..3, {x \in 1..3 : x > 1}} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])} |-> CASE (\A b11145 \in {} : FALSE) -> (b11143 - b11143) [] OTHER -> (b11143 + b11143)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 1, 0>>"
---*)
