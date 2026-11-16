(*---
description: Evaluates a random seq expression, seed 262, number 6802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(([<<1>> EXCEPT ![1] = FALSE] \o <<-1, -1>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-1>>"
---*)
