(*---
description: Evaluates a random set expression, seed 262, number 4733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b7398 \in UNION {({2, 1, 3} \cup 2..1), ({1, 2} \cap SUBSET {1})} |-> {b7399 \in UNION {{1, 2}, {2, 1, 3}} : (0 < 1)}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04733 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
