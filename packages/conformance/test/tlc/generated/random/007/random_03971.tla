(*---
description: Evaluates a random set expression, seed 262, number 3971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \cup 1..3) \cap ({1} \ SUBSET {1})) \ ((1..3 \cup Nat) \cap UNION {{2, 1, 3}, SUBSET {1}})) \cup ({(7 % 3), Cardinality({})} = (([a |-> 1]).a .. LET b6244 == -1 IN b6244))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03971 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
