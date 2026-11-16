(*---
description: Evaluates a random function expression, seed 262, number 4471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7036 \in {b7037 \in ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] \cap ({1, 2} \cap 2..1)) : (CASE FALSE -> 2 [] OTHER -> FALSE = Head(<<3, 1, 2>>))} |-> CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b7036] = [[a |-> 1] EXCEPT !.a = @ + 1]) -> Head([[a |-> 1] EXCEPT !.a = @ + 3]) [] OTHER -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b7036]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
