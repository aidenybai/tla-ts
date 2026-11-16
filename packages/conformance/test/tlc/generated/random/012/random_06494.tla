(*---
description: Evaluates a random seq expression, seed 262, number 6494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<CASE (Nat = 2..1) -> (7 * 1) [] OTHER -> (3 - 3), Cardinality(UNION {SUBSET {1}, {1}})>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06494 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
