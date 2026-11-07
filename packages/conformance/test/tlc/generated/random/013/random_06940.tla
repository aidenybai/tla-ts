(*---
description: Evaluates a random function expression, seed 262, number 6940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(2..1) \div Cardinality({1, 2})) :> [Append(<<1, 2>>, 3) EXCEPT ![1] = Len(<<>>)]) @@ (CHOOSE f \in [{} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> <<0, 2, 3>>)"
---*)
