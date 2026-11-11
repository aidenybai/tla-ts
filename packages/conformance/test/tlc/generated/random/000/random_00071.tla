(*---
description: Evaluates a random bool expression, seed 262, number 71.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b105 \in (DOMAIN [b106 \in {} |-> b106] \cup (({x \in 1..3 : x > 1} \ 1..3) \cap DOMAIN {1, 2})) : ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (2 \div 7)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00071 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form {e1, ... ,eN})
    line 14, col 101 to line 14, col 113 of module random_00071
---*)
