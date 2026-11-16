(*---
description: Evaluates a random record expression, seed 262, number 6865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + LET b10529 == (3 * 3) IN LET b10530 == [a |-> 1, b |-> TRUE] IN 2] EXCEPT !.a = @ + (((1 :> 2) @@ (3 :> 2)) - (([a |-> 1, b |-> TRUE]).a \div IF TRUE THEN 0 ELSE 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06865 failed.
    2179:0 The second argument of \div is 0.
---*)
