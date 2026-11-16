(*---
description: Evaluates a random int expression, seed 262, number 5644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<IF (Nat \subseteq {1, 2}) THEN SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) ELSE (CHOOSE b8722 \in {x \in 1..3 : x > 1} : FALSE), (-(0 \div 1))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05644 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 26 to line 14, col 45 of module random_05644
---*)
