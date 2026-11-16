(*---
description: Evaluates a random int expression, seed 262, number 9313.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09313 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b14452 == CASE ([a |-> -1, b |-> TRUE] = [a |-> 2147483647, b |-> TRUE]) -> (-(-1 % 7)) [] OTHER -> (Head(<<>>) - CASE TRUE -> 0 [] OTHER -> 7) IN Cardinality(DOMAIN [b14453 \in {} |-> 3]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
