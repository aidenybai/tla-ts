(*---
description: Evaluates a random set expression, seed 262, number 3997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (Head(<<1, 2>>) \in (1..3 \cap 1..3)) -> CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> (CHOOSE b6284 \in {1} : TRUE) [] OTHER -> (-1 \div b6283) [] OTHER -> ([a |-> b6283, b |-> TRUE]).a : b6283 \in (((2..1 \cap Nat) \cap {0 : b6285 \in {2, 1, 3}}) \cap DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
