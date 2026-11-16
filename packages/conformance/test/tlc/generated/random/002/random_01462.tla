(*---
description: Evaluates a random set expression, seed 262, number 1462.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01462 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2336 \in {IF (~TRUE) THEN (-1 % 1) ELSE (-1 - 7), ([[a |-> 1] EXCEPT !.a = @ + 2147483647]).a} : ((({2, 1, 3} \ {}) = [<<1>> EXCEPT ![1] = [a |-> 1]]) <=> (({1} \cup <<5, 6>>) \subseteq (1..3 \ {1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01462 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
