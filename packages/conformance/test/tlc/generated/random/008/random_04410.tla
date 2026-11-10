(*---
description: Evaluates a random record expression, seed 262, number 4410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (1 \div 3), b |-> (TRUE <=> 1)] EXCEPT !.a = @ + IF (\A b6939 \in {1, 2} : FALSE) THEN (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) ELSE ([a |-> 1]).a] EXCEPT !.a = @ + (CHOOSE b6940 \in (({1, 2} \cup {x \in 1..3 : x > 1}) \cup (2 .. 7)) : ((CHOOSE r \in [a : {}] : TRUE) = [[a |-> 1] EXCEPT !.a = b6940]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04410 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 44 to line 14, col 53 of module random_04410
---*)
