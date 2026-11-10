(*---
description: Evaluates a random int expression, seed 262, number 8436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = ([a |-> 1]).a] EXCEPT !.a = @ + ((7 % 1) + (-1))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
