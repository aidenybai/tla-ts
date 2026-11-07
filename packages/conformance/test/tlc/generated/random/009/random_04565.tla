(*---
description: Evaluates a random set expression, seed 262, number 4565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b7159 \in {(1 % b7160) : b7160 \in [a |-> 1..3, b |-> TRUE]} |-> LET b7161 == (b7159 * SUBSET {1}) IN IF FALSE THEN b7161 ELSE b7161])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04565 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1..3, b |-> TRUE].
    line 14, col 59 to line 14, col 82 of module random_04565
---*)
