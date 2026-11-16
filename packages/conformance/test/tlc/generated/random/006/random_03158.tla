(*---
description: Evaluates a random set expression, seed 262, number 3158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE r \in [a : {}] : TRUE)).a : b5035 \in (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03158 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 2].
    line 14, col 65 to line 14, col 102 of module random_03158
---*)
