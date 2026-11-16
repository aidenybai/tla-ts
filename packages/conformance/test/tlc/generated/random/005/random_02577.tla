(*---
description: Evaluates a random int expression, seed 262, number 2577.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02577 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a) \div IF (Head(<<1, 2>>) < (-2147483647)) THEN ((1 + 0) - (2147483647 % 0)) ELSE (CHOOSE b4056 \in UNION {1..3, Nat} : (\E b4057 \in 2..1 : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02577 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
