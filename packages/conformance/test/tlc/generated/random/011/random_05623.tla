(*---
description: Evaluates a random int expression, seed 262, number 5623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-LET b8695 == (3 % 2147483647) IN CASE FALSE -> 0 [] OTHER -> 7) \div IF (((1 :> 2)).a \in ([a |-> 1, b |-> TRUE]).a) THEN Head(<<2, <<>>>>) ELSE IF (TRUE => [a |-> 1, b |-> TRUE]) THEN (3 * 2147483647) ELSE Len(<<>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05623 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
