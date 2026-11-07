(*---
description: Evaluates a random bool expression, seed 262, number 7161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (-([a |-> 1, b |-> TRUE]).a), b |-> ((<<1, 2>> \o <<1, 2>>) = [b11007 \in {} |-> -1])] = [a |-> (-IF FALSE THEN 0 ELSE 2147483647), b |-> ((2 % 2) \in (-1 .. 2147483647))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
