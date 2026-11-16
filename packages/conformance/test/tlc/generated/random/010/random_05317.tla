(*---
description: Evaluates a random bool expression, seed 262, number 5317.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05317 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) = ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])) \/ (Append(<<1>>, -1) = [[x \in Nat |-> x + 1] EXCEPT ![3] = 7])) => <<(CASE TRUE -> -1 [] OTHER -> -1 + (3 - 2)), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] = [a |-> 2, b |-> TRUE])>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05317 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a tuple.
    line 14, col 17 to line 14, col 288 of module random_05317
---*)
