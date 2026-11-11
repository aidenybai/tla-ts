(*---
description: Evaluates a random seq expression, seed 262, number 4395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = -1], LAMBDA e : e > 0), (CHOOSE b6913 \in ([a |-> 1, b |-> TRUE]).a : (FALSE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04395 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 90 to line 14, col 149 of module random_04395
---*)
