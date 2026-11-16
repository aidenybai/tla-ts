(*---
description: Evaluates a random bool expression, seed 262, number 9244.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09244 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([2 EXCEPT !.a = @ + -1]).a .. (CASE TRUE -> 1 [] OTHER -> 0 - LET b14351 == 2147483647 IN 1)) \subseteq DOMAIN [b14352 \in {b14353 \in 1..3 : TRUE} |-> IF TRUE THEN 1 ELSE 2147483647]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09244 failed.
    Attempted to apply EXCEPT construct to the value 2.
---*)
