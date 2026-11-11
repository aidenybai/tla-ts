(*---
description: Evaluates a random record expression, seed 262, number 9913.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09913 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = LET b15415 == LET b15416 == 2 IN b15416 IN (b15415 + b15415)] EXCEPT !.a = (~([<<3, 1, 2>> EXCEPT ![1] = 1] = [b15417 \in {} |-> 0]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> TRUE]"
---*)
