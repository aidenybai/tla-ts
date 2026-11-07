(*---
description: Evaluates a random record expression, seed 262, number 6876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([b10541 \in {3 : b10542 \in {1}} |-> (-b10541)])[(CHOOSE b10543 \in DOMAIN (1 :> 2) : (TRUE /\ TRUE))], b |-> [a |-> ((-0) * CASE TRUE -> -1 [] OTHER -> 0), b |-> ({b10544 \in [x \in 1..2 |-> x] : TRUE} = (1..3 \ {2, 1, 3}))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06876 failed.
    In applying the function
    (3 :> -3),
    the first argument is:
    1
    which is not in its domain.
---*)
