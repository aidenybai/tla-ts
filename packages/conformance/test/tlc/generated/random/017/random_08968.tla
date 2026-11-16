(*---
description: Evaluates a random bool expression, seed 262, number 8968.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08968 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b13909 == (CHOOSE b13910 \in Nat : FALSE) IN Head(<<1, 2>>) * ((2147483647 % 1) % IF TRUE THEN 2147483647 ELSE 1)) = CASE (\A b13911 \in {-1, 7} : (\E b13912 \in {x \in 1..3 : x > 1} : TRUE)) -> ({b13913 \in {1} : TRUE} = ([a |-> 1, b |-> TRUE]).a) [] OTHER -> (LET b13914 == 0 IN b13914 - (-7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08968 failed.
    Attempted to check equality of the set {1} with the value:
    1
---*)
