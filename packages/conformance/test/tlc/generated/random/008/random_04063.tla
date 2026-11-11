(*---
description: Evaluates a random set expression, seed 262, number 4063.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6395 \in (({FALSE, 2147483647} \ {b6396 \in {2, 1, 3} : TRUE}) \cap {Len(<<3, 1, 2>>), IF FALSE THEN 3 ELSE 2}) : ((({2, 1, 3} \cap SUBSET {1}) \cup {b6395, 1}) = {Cardinality({1, 2}) : b6397 \in UNION {1..3, {}}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04063 failed.
    Attempted to compare boolean FALSE with non-boolean:
    2
---*)
