(*---
description: Evaluates a random bool expression, seed 262, number 7871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<>>) \div Cardinality(2..1)) \div (CHOOSE b12154 \in (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE) : ({} = {1}))) < Cardinality(([b12155 \in {x \in 1..3 : x > 1} |-> 2147483647] \cap {7, 0}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
