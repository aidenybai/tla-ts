(*---
description: Evaluates a random record expression, seed 262, number 6448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(1 :> 7) EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = (CASE TRUE -> 7 [] OTHER -> 1 - (2147483647 - 1))] EXCEPT !.a = (CHOOSE b9924 \in ((0 + -1) .. (0 * 7)) : (([x \in 1..2 |-> x])[b9924] = LET b9925 == -1 IN 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06448 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
