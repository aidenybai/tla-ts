(*---
description: Evaluates a random int expression, seed 262, number 1444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (~((1 = 7) /\ (TRUE => FALSE))) THEN ((-(3 - 7)) * [[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = (CHOOSE b2313 \in 2..1 : FALSE)]) ELSE (CHOOSE b2314 \in UNION {{2, 2}, (2147483647 .. 3)} : [[a |-> Nat, b |-> TRUE] EXCEPT !.a = @ + ([x \in Nat |-> x + 1])[7]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01444 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 112 to line 14, col 140 of module random_01444
---*)
