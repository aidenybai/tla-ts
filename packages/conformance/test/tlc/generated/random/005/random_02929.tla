(*---
description: Evaluates a random seq expression, seed 262, number 2929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<(-1), Cardinality({1, 2})>>) .. (Cardinality((TRUE => TRUE)) + ([b4633 \in {2, 1, 3} |-> -1])[LET b4634 == 1 IN b4634])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
