(*---
description: Evaluates a random record expression, seed 262, number 7222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (0 \div 2), b |-> (2..1 \ {})] EXCEPT !.a = @ + ([[a |-> 1] EXCEPT !.a = @ + 3]).a] EXCEPT !.a = @ + (([(1 :> 2) EXCEPT ![7] = -1] @@ [(1 :> 2) EXCEPT ![0] = 0]))[LET b11097 == (7 \div 7) IN ({1, 2} \cap {1, 2})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 130 to line 14, col 135 of module random_07222
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 161 to line 14, col 166 of module random_07222
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07222 failed.
    Attempted to check equality of integer 1 with non-integer:
    {1, 2}
---*)
