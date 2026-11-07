(*---
description: Evaluates a random int expression, seed 262, number 2609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((Nat \ {}) \cap {1, 7})) * ((({1, 2} \ SUBSET {1}) \ {b4108 : b4108 \in {x \in 1..3 : x > 1}}) + Cardinality(UNION {SUBSET {1}, Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02609 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
