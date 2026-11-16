(*---
description: Evaluates a random function expression, seed 262, number 2264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3565 \in ({(-2147483647), Cardinality({1})} \cup UNION {DOMAIN (1 :> 2), {b3566 : b3566 \in -1}}) |-> (((2147483647 * b3565) + (-1)) + ((b3565 :> 3))[LET b3567 == 1 IN b3565])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02264 failed.
    TLC encountered a non-enumerable quantifier bound
    -1.
    line 14, col 110 to line 14, col 111 of module random_02264
---*)
