(*---
description: Evaluates a random record expression, seed 262, number 6068.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06068 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head((<<1, 2>> \o <<3, 1, 2>>)), b |-> ((2..1 \ {2, 1, 3}) \subseteq (0 .. 7))] EXCEPT !.a = @ + ([a |-> IF FALSE THEN 3 ELSE 3, b |-> ([a |-> 1] = [a |-> 1, b |-> TRUE])]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 4, b |-> TRUE]"
---*)
