(*---
description: Evaluates a random int expression, seed 262, number 1262.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01262 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append((<<0, 7>> \o (<<>> \o <<1>>)), ([[a |-> 1] EXCEPT !.a = 7]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)
