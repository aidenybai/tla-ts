(*---
description: Evaluates a random bool expression, seed 262, number 2270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b3580 \in (UNION {{1, 2147483647}, (3 .. -1)} \cap ((0 * 0) .. (CHOOSE b3581 \in TRUE : TRUE))) : ((Len(<<1>>) < IF TRUE THEN 7 ELSE 0) <=> (\A b3582 \in SubSeq(<<3, 1, 2>>, 1..3, b3580) : ({x \in 1..3 : x > 1} = {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02270 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 84 to line 14, col 111 of module random_02270
---*)
