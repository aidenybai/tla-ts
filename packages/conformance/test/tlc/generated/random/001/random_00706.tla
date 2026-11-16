(*---
description: Evaluates a random record expression, seed 262, number 706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([a |-> 1, b |-> TRUE]).a, b |-> ((0 - 7) = CASE FALSE -> 7 [] OTHER -> 7)] EXCEPT !.a = @ + ((-([a |-> 1]).a) * (LET b1174 == 2147483647 IN -1 % ([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> FALSE]"
---*)
