(*---
description: Evaluates a random record expression, seed 262, number 9361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(([(<<1, 2>> \o <<>>) EXCEPT ![1] = (CHOOSE b14532 \in TRUE : TRUE)] \o <<(-1 % 1), IF FALSE THEN 2147483647 ELSE 2147483647>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09361 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 56 to line 14, col 84 of module random_09361
---*)
