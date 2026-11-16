(*---
description: Evaluates a random bool expression, seed 262, number 5169.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05169 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b8018 == Cardinality({2, 1, 3}) IN (3 % b8018) + IF ([a |-> 1, b |-> TRUE] = {}) THEN (CHOOSE b8019 \in 2..1 : TRUE) ELSE (-3)) % ((CHOOSE b8020 \in UNION {1..3, {x \in 1..3 : x > 1}} : (<<>> = <<5, 6>>)) \div ((CHOOSE b8021 \in {x \in 1..3 : x > 1} : FALSE) \div Cardinality({2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05169 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> TRUE]
    with non-record
    {}
---*)
