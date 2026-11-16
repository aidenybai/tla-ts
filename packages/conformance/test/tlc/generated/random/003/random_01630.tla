(*---
description: Evaluates a random record expression, seed 262, number 1630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = IF TRUE THEN 1 ELSE 7] EXCEPT !.a = @ + ([a |-> 3, b |-> FALSE]).a] EXCEPT !.a = @ + (-(IF FALSE THEN 2 ELSE 1 * IF TRUE THEN 1 ELSE -1))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3]"
---*)
