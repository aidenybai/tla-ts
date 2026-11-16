(*---
description: Evaluates a random int expression, seed 262, number 5066.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\A b7884 \in {x \in 1..3 : x > 1} : FALSE) THEN ([x \in 1..2 |-> x])[2147483647] ELSE Len(<<>>) - (CHOOSE b7885 \in (2..1 \cap SUBSET {1}) : (b7885 = 7))) % (((CHOOSE f \in [2..1 -> {}] : TRUE) @@ [b7886 \in {1} |-> b7886]))[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05066 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 121 to line 14, col 173 of module random_05066
---*)
