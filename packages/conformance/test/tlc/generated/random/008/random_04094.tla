(*---
description: Evaluates a random set expression, seed 262, number 4094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((2 \in Nat) \/ (TRUE \/ FALSE)) -> ((CHOOSE r \in [a : 2..1] : TRUE)).a [] OTHER -> (-(<<5, 6>>)[2147483647]), CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)) -> (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) \o [<<1, 2>> EXCEPT ![1] = 7]) [] OTHER -> CASE (FALSE /\ TRUE) -> (2..1 = 2..1) [] OTHER -> (CHOOSE b6438 \in {1} : TRUE)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04094 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 89 of module random_04094
---*)
