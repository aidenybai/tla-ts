(*---
description: Evaluates a random record expression, seed 262, number 9938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = Cardinality((7 .. 3))] EXCEPT !.a = @ + (CASE (TRUE /\ FALSE) -> (FALSE % 2) [] OTHER -> LET b15460 == 1 IN b15460 % ((1 % 2) * Head(<<1>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
