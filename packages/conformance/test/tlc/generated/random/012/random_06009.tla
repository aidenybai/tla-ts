(*---
description: Evaluates a random set expression, seed 262, number 6009.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<(1 + 0), IF TRUE THEN 7 ELSE 2>>) .. (-([[a |-> 1] EXCEPT !.a = @ + -1]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
