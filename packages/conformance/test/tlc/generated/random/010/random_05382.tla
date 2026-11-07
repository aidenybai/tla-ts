(*---
description: Evaluates a random seq expression, seed 262, number 5382.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05382 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> ([x \in 1..2 |-> x])[-1], b |-> (Nat = 1..3)] = [[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = @ + (CHOOSE b8319 \in 1..3 : TRUE)]) \/ (((7 % 0) * CASE FALSE -> -1 [] OTHER -> 7) = ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05382 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
