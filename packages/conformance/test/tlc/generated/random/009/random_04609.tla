(*---
description: Evaluates a random record expression, seed 262, number 4609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = @ + (<<5, 6>>)[2]] EXCEPT !.a = @ + IF (\A b7217 \in {} : FALSE) THEN ([a |-> 1]).a ELSE (CHOOSE b7218 \in {x \in 1..3 : x > 1} : FALSE)] EXCEPT !.a = @ + CASE (({1, 2} \cap 2..1) \/ <<1, -1>>) -> ((-1 - 1) + (CHOOSE b7219 \in {1} : FALSE)) [] OTHER -> (CASE FALSE -> 3 [] OTHER -> 2147483647 \div (<<5, 6>>)[0])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04609 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 233 to line 14, col 263 of module random_04609
---*)
