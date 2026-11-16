(*---
description: Evaluates a random seq expression, seed 262, number 7908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SortSeq([<<1, 2>> EXCEPT ![1] = 3], LAMBDA p, q : p < q) EXCEPT ![1] = Len([<<1, 2>> EXCEPT ![1] = 2147483647])], (CASE (Nat = 1..3) -> Head(<<3, 1, 2>>) [] OTHER -> (1 * 2) \div ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07908 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
