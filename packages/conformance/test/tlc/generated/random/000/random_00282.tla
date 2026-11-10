(*---
description: Evaluates a random set expression, seed 262, number 282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (({x \in 1..3 : x > 1} \ {}) = ({1} \cap {x \in 1..3 : x > 1})) -> (CHOOSE b477 \in (SUBSET {1} \ {1, 2}) : (TRUE \/ FALSE)) [] OTHER -> ((3 * 3) - (2 - 0)) \div ([a |-> IF TRUE THEN 3 ELSE 1, b |-> (<<1, 2>> = [x \in 1..2 |-> x])]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
