(*---
description: Evaluates a random set expression, seed 262, number 2108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(CHOOSE b3350 \in SortSeq(<<1>>, LAMBDA p, q : p < q) : (\E b3351 \in {x \in 1..3 : x > 1} : TRUE)), (Cardinality([a |-> 1]) % (3 * 0))}, {((b3352 * b3352) * ([a |-> 1]).a) : b3352 \in DOMAIN [b3353 \in Nat |-> b3353]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02108 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 25 to line 14, col 121 of module random_02108
---*)
