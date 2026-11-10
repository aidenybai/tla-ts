(*---
description: Evaluates a random bool expression, seed 262, number 84.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : 1..2] : TRUE)).a \div ((3 \div 2147483647) * (CHOOSE b130 \in 1..3 : TRUE))) \in ((([a |-> 1, b |-> TRUE] = [a |-> 1]) \ (Nat \ Nat)) \cap {{3, -1}, CASE FALSE -> 7 [] OTHER -> 2})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00084 failed.
    2179:0 The second argument of \div is 0.
---*)
