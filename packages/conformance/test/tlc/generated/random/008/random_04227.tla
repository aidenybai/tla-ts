(*---
description: Evaluates a random int expression, seed 262, number 4227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([a |-> 2147483647, b |-> TRUE] < CASE TRUE -> 3 [] OTHER -> 7) THEN (Cardinality({1, 2}) % IF FALSE THEN -1 ELSE 0) ELSE (([a |-> 1, b |-> TRUE]).a * (2 * 0)) * LET b6644 == CASE (\A b6645 \in 2..1 : FALSE) -> CASE FALSE -> 7 [] OTHER -> 7 [] OTHER -> (1 % 3) IN IF (2 = 7) THEN (-b6644) ELSE (b6644 + 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 2147483647, b |-> TRUE]
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 2147483647, b |-> TRUE]
---*)
