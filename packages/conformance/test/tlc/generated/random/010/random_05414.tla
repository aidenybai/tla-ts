(*---
description: Evaluates a random record expression, seed 262, number 5414.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05414 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((-3) * (0 \div 1)), b |-> ([a |-> -1, b |-> FALSE] = (CHOOSE r \in [a : 1..2] : TRUE))] EXCEPT !.a = @ + ([a |-> LET b8386 == 1 IN -1, b |-> (1..3 \subseteq {1})]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -1, b |-> FALSE]"
---*)
