(*---
description: Evaluates a random bool expression, seed 262, number 4892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a, ((CHOOSE r \in [a : {1}] : TRUE)).a} = UNION {(UNION {7, {}} \ (0 .. 2)), ((Nat \ 1..3) \cap {2, 2})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04892 failed.
    Attempted to compare the set {} with the value:
    7
---*)
