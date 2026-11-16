(*---
description: Evaluates a random int expression, seed 262, number 2094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (-1), b |-> ({2, 1, 3} = {2, 1, 3})] EXCEPT !.a = @ + Head((<<1>> \o <<>>))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
