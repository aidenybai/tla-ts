(*---
description: Evaluates a random int expression, seed 262, number 925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({-1, 1} \cap {b1491 \in 2..1 : TRUE})) - (Len(Append(<<1, 2>>, 0)) % (-CASE FALSE -> 1 [] OTHER -> 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00925 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2147483647
---*)
