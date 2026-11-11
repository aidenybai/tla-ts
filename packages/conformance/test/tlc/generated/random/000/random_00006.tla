(*---
description: Evaluates a random set expression, seed 262, number 6.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9 \in (CASE (7 < 0) -> (2 % 0) [] OTHER -> IF FALSE THEN <<3, 1, 2>> ELSE 1 .. Cardinality({b10 \in 2..1 : FALSE})) : ((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[(b9 * b9)] \in ({b11 \in [a |-> 1] : TRUE} \subseteq ({x \in 1..3 : x > 1} \ {2, 1, 3})))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
