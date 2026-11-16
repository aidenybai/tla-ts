(*---
description: Evaluates a random bool expression, seed 262, number 8748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b13542 \in DOMAIN ([[x \in 1..2 |-> x] EXCEPT ![-1] = 1] @@ [(1 :> 2) EXCEPT ![2147483647] = 2147483647]) : (\E b13543 \in (CHOOSE r \in [a : {1}] : TRUE) : (SelectSeq(<<1, 2>>, LAMBDA e : e > 0) = [b13544 \in {1, 2} |-> 2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 40 to line 14, col 57 of module random_08748
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 82 to line 14, col 87 of module random_08748
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08748 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1].
    line 14, col 144 to line 14, col 172 of module random_08748
---*)
