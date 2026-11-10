(*---
description: Evaluates a random set expression, seed 262, number 6398.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06398 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE [b9846 \in ({x \in 1..3 : x > 1} \cap {}) |-> Head(<<3, 1, 2>>)] -> ((7 % 0) - ((1 :> 2) @@ [x \in 1..2 |-> x])) [] OTHER -> ((7 :> b9845))[(b9845 * b9845)] : b9845 \in (((-0) .. (CHOOSE b9847 \in Nat : FALSE)) \ {(-1), ([a |-> 1]).a})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06398 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 202 to line 14, col 229 of module random_06398
---*)
