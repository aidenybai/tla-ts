(*---
description: Evaluates a random seq expression, seed 262, number 8112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(((<<3, 1, 2>> \o <<1, 2>>) \o (<<1, 2>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1, 2, 1, 2, 3, 1, 2>>"
---*)
