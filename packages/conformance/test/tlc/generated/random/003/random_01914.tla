(*---
description: Evaluates a random set expression, seed 262, number 1914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([b3009 \in {7 : b3010 \in 1..3} |-> CASE [a |-> 1, b |-> TRUE] -> b3009 [] OTHER -> 1] @@ ([[x \in 1..2 |-> x] EXCEPT ![1] = -1] @@ (2..1 @@ [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01914 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 65 to line 14, col 85 of module random_01914
---*)
