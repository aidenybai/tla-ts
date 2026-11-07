(*---
description: Evaluates a random set expression, seed 262, number 980.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00980 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a + (-1 \div 0)) .. ((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[(1 + -1)]) \ {Head(SubSeq(<<3, 1, 2>>, b1574, b1574)) : b1574 \in DOMAIN [[x \in 1..2 |-> x] EXCEPT ![1] = 2]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
