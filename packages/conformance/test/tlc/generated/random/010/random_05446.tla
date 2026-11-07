(*---
description: Evaluates a random set expression, seed 262, number 5446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail([<<1>> EXCEPT ![1] = 2147483647])) .. ((([a |-> 1] - 3) \div ([a |-> 1, b |-> TRUE]).a) + ((2 \div 2147483647) % Cardinality(2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
