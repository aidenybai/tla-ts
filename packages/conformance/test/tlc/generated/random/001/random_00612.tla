(*---
description: Evaluates a random record expression, seed 262, number 612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + ([a |-> 1]).a] EXCEPT !.a = ((TRUE)[3] * Cardinality({}))] EXCEPT !.a = IF (CHOOSE r \in [a : {0} \cup {1}] : TRUE) THEN ([<<1, 2>> EXCEPT ![1] = 3] \div (CHOOSE b1025 \in 2..1 : FALSE)) ELSE (([a |-> 1]).a * (-1 - 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00612 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 106 to line 14, col 114 of module random_00612
---*)
