(*---
description: Evaluates a random record expression, seed 262, number 1931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(TRUE => TRUE) EXCEPT !.a = @ + Cardinality({1, 2})] EXCEPT !.a = @ + (CHOOSE b3036 \in DOMAIN (1 :> 2) : (SUBSET {1} = 2..1))] EXCEPT !.a = (((2147483647 + -1) * (3 * 0)) + ((-2) - CASE TRUE -> 7 [] OTHER -> 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01931 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
