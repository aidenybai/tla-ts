(*---
description: Evaluates a random record expression, seed 262, number 5552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b8585 \in {1} : 2), b |-> (<<1>> = (1 :> 2))] EXCEPT !.a = @ + LET b8586 == (7 + 7) IN ([a |-> 1]).a] EXCEPT !.a = (((CHOOSE r \in [a : 1..2] : TRUE) - (CHOOSE b8587 \in SUBSET {1} : b8587)) % ((2 - 2) - ([a |-> 1, b |-> TRUE] - 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 26 to line 14, col 49 of module random_05552
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 26 to line 14, col 49 of module random_05552
---*)
