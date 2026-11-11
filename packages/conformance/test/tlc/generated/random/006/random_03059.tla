(*---
description: Evaluates a random int expression, seed 262, number 3059.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03059 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (1..3 \subseteq {1}) THEN ([a |-> 1, b |-> TRUE]).a ELSE Len(<<3, 1, 2>>) + CASE [<<5, 6>> EXCEPT ![2147483647] = 0] -> (3 * 0) [] OTHER -> (3 \div 1)) * CASE ([a |-> 2, b |-> FALSE] = (CHOOSE r \in [a : {1}] : TRUE)) -> Cardinality(({1} \ SUBSET {1})) [] OTHER -> {b4860 \in (2 :> 2) : (1..3 \subseteq 2..1)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 103 to line 14, col 110 of module random_03059
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03059 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 102 to line 14, col 136 of module random_03059
---*)
