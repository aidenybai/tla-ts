(*---
description: Evaluates a random function expression, seed 262, number 725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1191 \in ((([a |-> 1, b |-> TRUE]).a + LET b1192 == 7 IN 7) .. LET b1193 == ({1} \cap {1}) IN (1 * 1)) |-> Len(<<(3 % b1191), CASE FALSE -> 2 [] OTHER -> [a |-> 1, b |-> TRUE]>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
