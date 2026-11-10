(*---
description: Evaluates a random set expression, seed 262, number 3081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-Cardinality(1..3)) : b4895 \in {Head(<<3, 1, 2>>) : b4896 \in UNION {SUBSET {1}, {1}}}} \ ({b4897 \in {2, (1 :> 2)} : (\E b4898 \in b4897 : FALSE)} \ {b4899 \in {b4900 \in {} : TRUE} : (\A b4901 \in 2..1 : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03081 failed.
    Attempted to compare the set {} with the value:
    1
---*)
