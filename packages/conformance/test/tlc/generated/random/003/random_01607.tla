(*---
description: Evaluates a random int expression, seed 262, number 1607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({((1 :> 2))[b2564] : b2564 \in ({1} \cup SUBSET {1})} \cap {b2565 \in UNION {SUBSET {1}, {2, 1, 3}} : (7 = 0)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01607 failed.
    Attempted to compare the set {} with the value:
    1
---*)
