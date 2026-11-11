(*---
description: Evaluates a random int expression, seed 262, number 1550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b2471 \in {7, <<5, 6>>} : DOMAIN <<5, 6>>) * (-(0 % 3))) \div Len(([<<3, 1, 2>> EXCEPT ![1] = 2147483647] \o [<<>> EXCEPT ![1] = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01550 failed.
    Attempted to compare the function <<5, 6>> with the value:
    7
---*)
