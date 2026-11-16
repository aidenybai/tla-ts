(*---
description: Evaluates a random seq expression, seed 262, number 5848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<Len((<<1, 2>> \o <<>>)), Len(Append(<<1>>, {2, 1, 3}))>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
