(*---
description: Evaluates a random bool expression, seed 262, number 4677.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04677 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-(1 \div 7)), ((CHOOSE r \in [a : {1, 2}] : TRUE)).a} \subseteq DOMAIN [(7 :> 3) EXCEPT ![(1 + 0)] = (1 + 1)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 92 to line 14, col 97 of module random_04677
    | FALSE
---*)
