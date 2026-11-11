(*---
description: Evaluates a random function expression, seed 262, number 9309.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09309 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (3 \in {1}) THEN (0 * 2) ELSE (1 - 7) :> (CHOOSE b14445 \in (7 .. -1) : (\A b14446 \in {1} : TRUE))) @@ (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09309 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 118 of module random_09309
---*)
