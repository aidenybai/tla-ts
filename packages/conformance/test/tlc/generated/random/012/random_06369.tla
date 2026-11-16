(*---
description: Evaluates a random set expression, seed 262, number 6369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-([x \in 1..2 |-> x])[-1]) - Cardinality(DOMAIN (1 :> 2))) .. Len([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + Cardinality(Nat)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06369 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
