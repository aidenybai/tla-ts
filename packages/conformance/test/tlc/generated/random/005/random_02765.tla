(*---
description: Evaluates a random set expression, seed 262, number 2765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{} -> {}] : TRUE) \ DOMAIN [[b4362 \in SUBSET {1} |-> b4362] EXCEPT ![(0 - 3)] = IF FALSE THEN 2 ELSE -1]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02765 failed.
    Attempted to check if the non-enumerable value
    -3
    is element of
    {{}, {1}}
---*)
