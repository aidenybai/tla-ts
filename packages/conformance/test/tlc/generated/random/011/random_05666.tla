(*---
description: Evaluates a random bool expression, seed 262, number 5666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((Tail(<<3, 1, 2>>) \o Append(<<>>, 2147483647)) = [b8743 \in DOMAIN [x \in 1..2 |-> x] |-> ([x \in Nat |-> x + 1])[-1]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05666 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 126 to line 14, col 130 of module random_05666>],
    the first argument is:
    -1
    which is not in its domain.
---*)
