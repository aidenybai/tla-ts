(*---
description: Evaluates a random function expression, seed 262, number 6460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (CASE FALSE -> 2147483647 [] OTHER -> 2147483647 < ([a |-> 1]).a) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a [] OTHER -> [[a |-> 7, b |-> TRUE] EXCEPT !.a = @ + (-7)] :> IF (~(\A b9942 \in {} : TRUE)) THEN [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = Head(<<>>)] ELSE [(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (1 + 0)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> 0, b |-> TRUE] :> [a |-> 1])"
---*)
