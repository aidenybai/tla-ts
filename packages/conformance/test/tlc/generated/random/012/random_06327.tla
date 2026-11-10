(*---
description: Evaluates a random record expression, seed 262, number 6327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (-((<<5, 6>> @@ (1 :> 2)))[Len(<<1, 2>>)])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -6]"
---*)
