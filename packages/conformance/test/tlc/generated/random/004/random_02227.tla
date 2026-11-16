(*---
description: Evaluates a random bool expression, seed 262, number 2227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {({} \cap 2..1), DOMAIN [x \in Nat |-> x + 1]} = {(TRUE).a, ([a |-> 1, b |-> TRUE]).a}) \/ (((-1 % 7) \div (1 .. 0)) < (CASE [a |-> 1] -> 0 [] OTHER -> 3 * (-1 * 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02227 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 74 to line 14, col 81 of module random_02227
---*)
