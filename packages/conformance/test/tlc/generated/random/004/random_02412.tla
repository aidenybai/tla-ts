(*---
description: Evaluates a random function expression, seed 262, number 2412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<(3 % 1), (CHOOSE b3812 \in 1..3 : TRUE)>>) :> CASE (\A b3813 \in (3 .. -1) : (FALSE <=> FALSE)) -> Cardinality(({1} \cup {1, 2})) [] OTHER -> (([a |-> 1, b |-> TRUE]).a + (<<5, 6>>)[2])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 2)"
---*)
