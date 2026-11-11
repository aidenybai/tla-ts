(*---
description: Evaluates a random seq expression, seed 262, number 5191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq([SubSeq(<<1>>, 1, 1) EXCEPT ![1] = CASE FALSE -> 3 [] OTHER -> 1], LAMBDA e : e > 0) EXCEPT ![1] = {b8048 \in (LET b8049 == 1 IN b8049 .. (CHOOSE b8050 \in Nat : FALSE)) : (~(FALSE => TRUE))}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05191 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 166 to line 14, col 193 of module random_05191
---*)
