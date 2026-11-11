(*---
description: Evaluates a random record expression, seed 262, number 5722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ((CHOOSE b8801 \in {b8802 \in {} : {}} : (0 < 3)) - CASE (\A b8803 \in 2..1 : FALSE) -> [a |-> <<1>>, b |-> FALSE] [] OTHER -> LET b8804 == 2 IN 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05722 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 73 to line 14, col 118 of module random_05722
---*)
