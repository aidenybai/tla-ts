(*---
description: Evaluates a random set expression, seed 262, number 1740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([b2763 \in {} |-> b2763] @@ (b2762 :> 2147483647)))[IF (1 = 2) THEN (b2762 - -1) ELSE (CHOOSE b2764 \in {} : TRUE)] : b2762 \in UNION {DOMAIN [b2765 \in Nat |-> b2765], DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![-1] = 0]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 196 to line 14, col 216 of module random_01740
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01740 failed.
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)
