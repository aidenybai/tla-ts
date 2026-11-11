(*---
description: Evaluates a random record expression, seed 262, number 7484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = (-CASE ([x \in 1..2 |-> x] = [x \in Nat |-> x + 1]) -> (\E b11537 \in 1..3 : -1) [] OTHER -> (CHOOSE b11538 \in Nat : {x \in 1..3 : x > 1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07484 failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
