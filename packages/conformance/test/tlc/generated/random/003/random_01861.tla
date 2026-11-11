(*---
description: Evaluates a random record expression, seed 262, number 1861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = (3 * 7)] EXCEPT !.a = (CHOOSE b2935 \in {b2936 \in 2..1 : FALSE} : (TRUE \/ FALSE))] EXCEPT !.a = Cardinality({b2937 \in DOMAIN [x \in 1..2 |-> x] : (~TRUE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01861 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 96 to line 14, col 154 of module random_01861
---*)
