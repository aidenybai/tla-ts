(*---
description: Evaluates a random set expression, seed 262, number 9260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality({CASE FALSE -> 7 [] OTHER -> 2, Head(<<3, 1, 2>>)}), (((CHOOSE b14373 \in Nat : TRUE) :> [b14374 \in {1} |-> 3]) % LET b14375 == (-3) IN (b14375 - b14375))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09260 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 85 to line 14, col 112 of module random_09260
---*)
