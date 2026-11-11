(*---
description: Evaluates a random int expression, seed 262, number 5047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((Head(<<3, 1, 2>>) < IF FALSE THEN 1 ELSE -1) \/ (~(0 * 7))) -> ((Head(<<1>>) - (-1)) % LET b7848 == (-2147483647) IN ([a |-> 1, b |-> TRUE]).a) [] OTHER -> LET b7849 == IF (<<1, 2>> = [x \in 1..2 |-> x]) THEN (-1 % 7) ELSE Cardinality({1}) IN (Tail(<<>>) - (b7849 - -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05047 failed.
    Attempted to apply the operator ~ to a non-boolean
    (an integer)
    line 14, col 72 to line 14, col 79 of module random_05047
---*)
