(*---
description: Evaluates a random seq expression, seed 262, number 7969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Len(SelectSeq(<<2147483647, 3>>, LAMBDA e : e > 0)), (-((CHOOSE b12305 \in Nat : FALSE) * Head(<<>>)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07969 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 75 to line 14, col 103 of module random_07969
---*)
