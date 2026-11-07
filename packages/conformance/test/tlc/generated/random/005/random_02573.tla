(*---
description: Evaluates a random seq expression, seed 262, number 2573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<IF (\E b4051 \in {2, 1, 3} : TRUE) THEN (3 * 2..1) ELSE (CHOOSE b4052 \in SUBSET {1} : FALSE), IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN CASE TRUE -> 3 [] OTHER -> -1 ELSE CASE TRUE -> 1 [] OTHER -> 7>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    {}
    2266:0 The first argument of > should be an integer, but instead it is:
    {}
---*)
