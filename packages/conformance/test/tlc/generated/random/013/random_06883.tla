(*---
description: Evaluates a random bool expression, seed 262, number 6883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append((<<5, 6>>)[3], Len(<<1>>))) < (((7 \div 7) - CASE TRUE -> 3 [] OTHER -> 0) \div Cardinality(UNION {SUBSET {1}, {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06883 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
