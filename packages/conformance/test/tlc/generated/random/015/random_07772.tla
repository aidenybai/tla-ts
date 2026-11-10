(*---
description: Evaluates a random function expression, seed 262, number 7772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11990 \in (DOMAIN [(1 :> 2) EXCEPT ![3] = 2] \ ({7 : b11991 \in [a |-> 1]} \cap {b11992 \in Nat : TRUE})) |-> (([[a |-> 1] EXCEPT !.a = @ + b11990]).a + Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 43 of module random_07772
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07772 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1].
    line 14, col 82 to line 14, col 90 of module random_07772
---*)
