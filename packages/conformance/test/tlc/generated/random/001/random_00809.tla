(*---
description: Evaluates a random bool expression, seed 262, number 809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(((<<1, 2>> \o <<3, 1, 2>>) \o [[x \in 1..2 |-> x] EXCEPT ![1] = 2]), Head([<<3, 1, 2>> EXCEPT ![1] = 3])) \subseteq Append(SortSeq((<<1>> \o <<>>), LAMBDA p, q : p < q), IF (SUBSET {1} = 1..3) THEN (-1 * 1) ELSE Head(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00809 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 17 to line 14, col 250 of module random_00809
---*)
