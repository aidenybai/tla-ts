(*---
description: Evaluates a random bool expression, seed 262, number 4090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~LET b6431 == ((CHOOSE b6432 \in TRUE : FALSE) + [(1 :> 2) EXCEPT ![0] = 2147483647]) IN ((2 - 7) * (b6431 \div b6431))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04090 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 33 to line 14, col 61 of module random_04090
---*)
