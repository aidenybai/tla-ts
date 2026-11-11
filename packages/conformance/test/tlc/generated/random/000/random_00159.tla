(*---
description: Evaluates a random int expression, seed 262, number 159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((2 - 0) \in {b246 \in {1, 2} : TRUE}) => ([a |-> 0, b |-> <<>>] = [a |-> 7, b |-> FALSE])) THEN (-((CHOOSE r \in [a : {1, 2}] : TRUE)).a) ELSE (CHOOSE r \in [a : {0} \cup {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
