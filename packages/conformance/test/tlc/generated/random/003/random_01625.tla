(*---
description: Evaluates a random function expression, seed 262, number 1625.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01625 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2596 \in (Len(<<1, -1>>) = ((0 % 1) - (1 + 0))) |-> (Len((<<3, 1, 2>> \o <<3, 1, 2>>)) + (CASE TRUE -> b2596 [] OTHER -> b2596 \div (0 % 2)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b2596 \\in FALSE |-> <expression line 14, col 71 to line 14, col 157 of module random_01625>]"
---*)
