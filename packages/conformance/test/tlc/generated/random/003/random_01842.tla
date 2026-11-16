(*---
description: Evaluates a random set expression, seed 262, number 1842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b2916 == (-(7 % b2915)) IN ((b2915 .. b2915) % (b2916 - 1)) : b2915 \in (((2147483647 \div 2) .. CASE TRUE -> 1 [] OTHER -> 2) \cap {Len(<<1, 2>>), IF FALSE THEN 0 ELSE 1})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
