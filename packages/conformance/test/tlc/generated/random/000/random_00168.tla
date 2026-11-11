(*---
description: Evaluates a random set expression, seed 262, number 168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (({} \ {1}) \subseteq (0 .. 7)) THEN (Head(<<3, 1, 2>>) + (CHOOSE b269 \in {1} : FALSE)) ELSE ([3 EXCEPT !.a = 2]).a, (([[a |-> 1] EXCEPT !.a = 1]).a \div ((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))[(2147483647 % 0)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00168 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 79 to line 14, col 105 of module random_00168
---*)
