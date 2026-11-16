(*---
description: Evaluates a random bool expression, seed 262, number 3146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq((<<>> \o <<>>), LAMBDA e : e > 0)) < (IF ({2, 1, 3} \subseteq 2..1) THEN (-1 + -1) ELSE IF TRUE THEN 7 ELSE -1 + ([[a |-> 1] EXCEPT !.a = 1]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
