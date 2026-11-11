(*---
description: Evaluates a random set expression, seed 262, number 3224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5121 \in {([a |-> 1, b |-> FALSE]).a, IF (7 < 2147483647) THEN (7 % 2) ELSE Len(<<1>>)} : (((CHOOSE b5122 \in Nat : FALSE) * (<<>>).a) < (CHOOSE b5123 \in UNION {{x \in 1..3 : x > 1}, {2, 1, 3}} : [[a |-> 1] EXCEPT !.a = 1]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03224 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 111 to line 14, col 138 of module random_03224
---*)
