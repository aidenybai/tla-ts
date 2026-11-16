(*---
description: Evaluates a random bool expression, seed 262, number 4868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-IF TRUE THEN 3 ELSE -1) % Len((<<3, 1, 2>> \o <<1>>))) < ((Head(<<1, 2>>) % LET b7582 == 7 IN b7582) - (IF TRUE THEN 3 ELSE -1 * (0 \div 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
