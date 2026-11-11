(*---
description: Evaluates a random bool expression, seed 262, number 4809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\E b7500 \in DOMAIN (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) : ({7, (1 :> 2)} \subseteq UNION {{x \in 1..3 : x > 1}, 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04809 failed.
    Attempted to compare the function <<2>> with the value:
    7
---*)
