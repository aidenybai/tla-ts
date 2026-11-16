(*---
description: Evaluates a random bool expression, seed 262, number 4964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7727 \in (LET b7728 == ([x \in Nat |-> x + 1])[2] IN (CHOOSE b7729 \in <<5, 6>> : TRUE) .. (CHOOSE b7730 \in UNION {2..1, {1}} : (b7730 \in Nat))) : (\A b7731 \in (UNION {{1, 2}, {x \in 1..3 : x > 1}} \cap (0 .. b7727)) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] = [a |-> 2, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04964 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 75 to line 14, col 106 of module random_04964
---*)
