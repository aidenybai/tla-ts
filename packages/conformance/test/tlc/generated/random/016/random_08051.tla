(*---
description: Evaluates a random record expression, seed 262, number 8051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> -1, b |-> TRUE] EXCEPT !.a = (CHOOSE b12432 \in 2..1 : TRUE)] EXCEPT !.a = @ + (LET b12433 == 2 IN 3 \in {{2, 1, 3} : b12434 \in 2..1})] EXCEPT !.a = @ + ((CASE TRUE -> 2147483647 [] OTHER -> -1 % IF FALSE THEN 0 ELSE 0) \div (LET b12435 == [a |-> 1, b |-> TRUE] IN b12435 * (CHOOSE b12436 \in {2, 1, 3} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08051 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 56 to line 14, col 84 of module random_08051
---*)
