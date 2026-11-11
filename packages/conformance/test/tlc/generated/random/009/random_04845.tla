(*---
description: Evaluates a random record expression, seed 262, number 4845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\A b7560 \in {CASE FALSE -> -1 [] OTHER -> 3 : b7561 \in DOMAIN [x \in 1..2 |-> x]} : ((CHOOSE r \in [a : 2..1] : TRUE) = [a |-> b7560, b |-> 2..1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04845 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 107 to line 14, col 136 of module random_04845
---*)
