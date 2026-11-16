(*---
description: Evaluates a random record expression, seed 262, number 5908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (-IF TRUE THEN 7 ELSE 1)] EXCEPT !.a = (Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) + ((CHOOSE b9116 \in Nat : FALSE) * Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05908 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 156 to line 14, col 183 of module random_05908
---*)
