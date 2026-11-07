(*---
description: Evaluates a random function expression, seed 262, number 1955.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01955 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a % (CHOOSE b3079 \in {} : FALSE)) * (CASE FALSE -> 1 [] OTHER -> 0 = (2147483647 + 2147483647))) :> Len(SelectSeq(SubSeq(<<3, 1, 2>>, 0, 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01955 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 48 to line 14, col 74 of module random_01955
---*)
