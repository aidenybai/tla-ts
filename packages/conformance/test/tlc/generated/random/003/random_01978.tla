(*---
description: Evaluates a random seq expression, seed 262, number 1978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Append(SortSeq(<<1>>, LAMBDA p, q : p < q), SubSeq(<<1, 2>>, 2, -1)) \o [SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (0 \div FALSE)]) EXCEPT ![1] = (CHOOSE b3137 \in {IF TRUE THEN b3138 ELSE 7 : b3138 \in DOMAIN (1 :> 2)} : (({2, 1, 3} \cap Nat) = (2147483647 .. b3137)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 91 to line 14, col 124 of module random_01978
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01978 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 172 to line 14, col 292 of module random_01978
---*)
