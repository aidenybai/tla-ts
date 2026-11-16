(*---
description: Evaluates a random set expression, seed 262, number 5477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b8474 \in ({1, 2147483647} \ UNION {2..1, {1}}) |-> CASE (b8474 \in {1, 2}) -> (0 - b8474) [] OTHER -> (CHOOSE b8475 \in {1, 2} : FALSE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05477 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 128 to line 14, col 158 of module random_05477
---*)
