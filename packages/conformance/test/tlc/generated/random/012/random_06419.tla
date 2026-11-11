(*---
description: Evaluates a random bool expression, seed 262, number 6419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b9883 \in {Head([<<1, 2>> EXCEPT ![1] = 2147483647]) : b9884 \in DOMAIN [b9885 \in {x \in 1..3 : x > 1} |-> b9885]} : ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = ({x \in 1..3 : x > 1} \ <<5, 6>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06419 failed.
    Attempted to check set membership in a tuple value.
---*)
