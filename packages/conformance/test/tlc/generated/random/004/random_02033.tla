(*---
description: Evaluates a random set expression, seed 262, number 2033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (7 \in {1, 2}) -> (CHOOSE b3229 \in {1} : TRUE) [] OTHER -> (-7) - CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (2 + 3) [] OTHER -> Cardinality({x \in 1..3 : x > 1})) .. Head(<<Cardinality({1, 2}), CASE FALSE -> 2147483647 [] OTHER -> 2147483647>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -9..2"
---*)
