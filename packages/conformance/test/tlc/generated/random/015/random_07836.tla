(*---
description: Evaluates a random int expression, seed 262, number 7836.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07836 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b12108 \in (UNION {{}, {1, 2}} \cup {1 : b12109 \in {1, 2}}) : (CHOOSE r \in [a : {1}] : TRUE)) * CASE (~(FALSE /\ FALSE)) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a [] OTHER -> ((1 + 2147483647) % (2)[-1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 18 to line 14, col 118 of module random_07836
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 18 to line 14, col 118 of module random_07836
---*)
