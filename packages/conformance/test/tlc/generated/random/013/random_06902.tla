(*---
description: Evaluates a random bool expression, seed 262, number 6902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(<<(2147483647 .. 7), IF TRUE THEN 1 ELSE 1>>) = (Len((<<1>> \o <<1>>)) :> (IF TRUE THEN 3 ELSE 2 * (2147483647 - 2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
