(*---
description: Evaluates a random function expression, seed 262, number 7320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) EXCEPT ![(3 + 7)] = (7 \div 2)] @@ (([a |-> 1, b |-> TRUE]).a :> (2 + 3))) EXCEPT ![(((FALSE \/ TRUE) /\ (3 \in {}))).a] = (((Nat \cap <<1, 2>>) - (<<5, 6>>)[{2, 1, 3}]) \div IF (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE) THEN (0 \div 2147483647) ELSE IF TRUE THEN {} ELSE 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 61 of module random_07320
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07320 failed.
    Attempted to select field "a" from a non-record value FALSE
    line 14, col 148 to line 14, col 182 of module random_07320
---*)
