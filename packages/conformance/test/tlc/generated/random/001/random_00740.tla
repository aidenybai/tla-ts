(*---
description: Evaluates a random bool expression, seed 262, number 740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Cardinality(SUBSET {1}), (7 + 0)} \subseteq (Cardinality(<<3, 1, 2>>) .. IF FALSE THEN 2 ELSE -1)) <=> (CHOOSE r \in [a : {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00740 failed.
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
---*)
