(*---
description: Evaluates a random set expression, seed 262, number 2147.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02147 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (([a |-> 2, b |-> TRUE]).a \div ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02147 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 16 to line 14, col 102 of module random_02147
---*)
