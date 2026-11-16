(*---
description: Evaluates a random int expression, seed 262, number 7266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11184 \in UNION {((3 .. 2) \ (SUBSET {1} \ {1, 2})), ((-3) .. (CHOOSE b11185 \in <<5, 6>> : TRUE))} : (\E b11186 \in {b11187 \in {b11188 : b11188 \in 2..1} : (FALSE => TRUE)} : ((CHOOSE f \in [1..2 -> 2..1] : TRUE) = [a |-> b11186, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07266 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 88 to line 14, col 120 of module random_07266
---*)
