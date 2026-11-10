(*---
description: Evaluates a random record expression, seed 262, number 3058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len(<<0, 2>>) \div IF (TRUE \/ FALSE) THEN ([a |-> 1, b |-> TRUE]).a ELSE CASE FALSE -> 0 [] OTHER -> 3), b |-> (~([[a |-> 1] EXCEPT !.a = 2147483647] = (CHOOSE r \in [a : 1..2] : TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> TRUE]"
---*)
