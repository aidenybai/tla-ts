(*---
description: Evaluates a random seq expression, seed 262, number 1493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (-(([a |-> 1, b |-> TRUE]).a % ([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
