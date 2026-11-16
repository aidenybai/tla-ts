(*---
description: Evaluates a random bool expression, seed 262, number 7512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : 1..2] : TRUE)).a = Head(((<<3, 1, 2>> \o <<1, 2>>) \o Append(<<1, 2>>, -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
