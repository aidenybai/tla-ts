(*---
description: Evaluates a random int expression, seed 262, number 6558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = CASE (TRUE /\ [x \in 1..2 |-> x]) -> (1 + 2) [] OTHER -> (0 * 2)] EXCEPT !.a = {Cardinality(DOMAIN (1 :> 2)) : b10079 \in (CHOOSE r \in [a : 1..2] : TRUE)}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06558 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 78 to line 14, col 103 of module random_06558
---*)
