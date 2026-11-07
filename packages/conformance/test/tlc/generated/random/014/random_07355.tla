(*---
description: Evaluates a random seq expression, seed 262, number 7355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((Append((<<1>> \o <<>>), LET b11317 == 3 IN b11317) \o <<<<(1 :> 2), 0>>, ([a |-> 1, b |-> TRUE]).a>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, <<<<2>>, 0>>, 1>>"
---*)
