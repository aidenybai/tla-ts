(*---
description: Evaluates a random set expression, seed 262, number 6357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {DOMAIN (2 :> 1), {Len(<<1, 2>>), Cardinality({1, 2})}} \cap (UNION {(CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE), ((1 :> 2) \cap {})} \cup {IF FALSE THEN b9770 ELSE 2147483647 : b9770 \in ({1, 2} \cap {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06357 failed.
    Attempted to compare the set {} with the value:
    (2 :> 1)
---*)
