(*---
description: Evaluates a random seq expression, seed 262, number 8194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(IF (CHOOSE r \in [a : 2..1] : TRUE) THEN ([x \in Nat |-> x + 1])[1] ELSE ([a |-> 1]).a = ([<<5, 6>> EXCEPT ![1] = 2147483647])[(CHOOSE b12673 \in SUBSET {1} : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08194 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 23 to line 14, col 52 of module random_08194
---*)
