(*---
description: Evaluates a random int expression, seed 262, number 9902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) : b15397 \in (CASE TRUE -> 1 [] OTHER -> 7 \in DOMAIN [x \in 1..2 |-> x])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09902 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    line 14, col 84 to line 14, col 141 of module random_09902
---*)
