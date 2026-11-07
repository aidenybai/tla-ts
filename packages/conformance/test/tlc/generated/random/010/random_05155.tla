(*---
description: Evaluates a random bool expression, seed 262, number 5155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 \div 0) .. (1 + 1)) = (({1, 2} \cap {1, 2}) \ UNION {{x \in 1..3 : x > 1}, {1}})) <=> ((CHOOSE b8004 \in (7 .. 0) : ({1} = SUBSET {1})) < (CASE TRUE -> <<5, 6>> [] OTHER -> 2147483647 * Cardinality({x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
