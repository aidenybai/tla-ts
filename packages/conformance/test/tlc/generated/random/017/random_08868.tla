(*---
description: Evaluates a random set expression, seed 262, number 8868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-CASE FALSE -> 0 [] OTHER -> 3), (CASE FALSE -> 1 [] OTHER -> 2)[Cardinality(SUBSET {1})]} \cup {(CHOOSE b13734 \in Len(<<1>>) : (b13734 = 1)) : b13733 \in {(3 % 2), ([a |-> 1, b |-> TRUE]).a}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08868 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 52 to line 14, col 107 of module random_08868
---*)
