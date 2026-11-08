(*---
description: Evaluates a random bool expression, seed 262, number 7486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 % 3) \div Len(<<>>)) .. ((0 % 0) + CASE [a |-> 1, b |-> TRUE] -> 0 [] OTHER -> 2)) \subseteq {b11539 \in (Cardinality(Nat) .. (-7)) : (UNION {1..3, {1}} = DOMAIN <<5, 6>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07486 failed.
    2179:0 The second argument of \div is 0.
---*)
