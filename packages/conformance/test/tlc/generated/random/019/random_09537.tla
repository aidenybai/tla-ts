(*---
description: Evaluates a random set expression, seed 262, number 9537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b14820 \in (({x \in 1..3 : x > 1} \cup 2..1) \cap ({x \in 1..3 : x > 1} \cup 1..3)) : ((FALSE \/ FALSE) <=> (\E b14821 \in {} : FALSE))} \cap (((1 * 1) .. (0 + 0)) \ {(CHOOSE b14822 \in 0 : FALSE), (CHOOSE r \in [a : {}] : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09537 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 186 to line 14, col 212 of module random_09537
---*)
