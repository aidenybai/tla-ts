(*---
description: Evaluates a random record expression, seed 262, number 184.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00184 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b295 == CASE (-1 \in Nat) -> (7 * 7) [] OTHER -> Len(<<>>) IN ((-1) % Cardinality({})), b |-> (((2147483647 + 2) < ([x \in 1..2 |-> x])[2147483647]) => ({0, 2147483647} = ([x \in Nat |-> x + 1] \cap SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00184 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
