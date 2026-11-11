(*---
description: Evaluates a random set expression, seed 262, number 874.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00874 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = @ + 7]).a .. (CHOOSE b1415 \in DOMAIN [x \in Nat |-> x + 1] : (<<1, 2>> = <<5, 6>>))) \ UNION {((3 % 2) .. (3 * 0)), UNION {(SUBSET {1} \cup 2..1), DOMAIN [x \in 1..2 |-> x]}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00874 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 57 to line 14, col 125 of module random_00874
---*)
