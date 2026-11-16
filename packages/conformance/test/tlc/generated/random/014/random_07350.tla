(*---
description: Evaluates a random record expression, seed 262, number 7350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (LET b11310 == LET b11311 == 2 IN 7 IN Head(<<1, 2>>) - ((-1 % 2) + Head(<<3, 1, 2>>))), b |-> (\A b11312 \in {b11313 \in (3 .. 1) : (~TRUE)} : ((CHOOSE r \in [a : {1}] : TRUE) = (CHOOSE r \in [a : {1, 2}] : TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -3, b |-> TRUE]"
---*)
