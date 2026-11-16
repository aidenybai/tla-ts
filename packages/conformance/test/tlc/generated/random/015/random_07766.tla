(*---
description: Evaluates a random function expression, seed 262, number 7766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 + 7) :> (0 % 2)) @@ (([a |-> 1, b |-> TRUE]).a :> (CHOOSE b11979 \in 2..1 : FALSE))) @@ [b11980 \in {(b11981 % b11981) : b11981 \in {b11982 \in SUBSET {1} : FALSE}} |-> ((b11980 % b11980) % (0 * b11980))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07766 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 73 to line 14, col 102 of module random_07766
---*)
