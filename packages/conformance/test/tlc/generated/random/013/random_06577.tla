(*---
description: Evaluates a random bool expression, seed 262, number 6577.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06577 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 0 [] OTHER -> <<1>> % <<3, 0>>) - (Head([a |-> 1, b |-> TRUE]) + (-1 % 0))) < (CHOOSE b10103 \in UNION {UNION {Nat, 1..3}, UNION {{1}, <<5, 6>>}} : ((TRUE \/ FALSE) /\ (\E b10104 \in {x \in 1..3 : x > 1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
