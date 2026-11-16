(*---
description: Evaluates a random int expression, seed 262, number 1897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b2977 == 3 IN 7 % ([x \in Nat |-> x + 1])[1]) * CASE (\A b2978 \in {} : FALSE) -> Head(<<3, 1, 2>>) [] OTHER -> (CHOOSE b2979 \in (1 :> 2) : TRUE)) + CASE (<<2147483647, -1>> = [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2]) -> LET b2980 == (-1) IN Len(<<3, 1, 2>>) [] OTHER -> ((-1 + 3) - ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 201 to line 14, col 218 of module random_01897
    | 4
---*)
