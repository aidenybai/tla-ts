(*---
description: Evaluates a random function expression, seed 262, number 9794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15198 \in ({CASE TRUE -> 2 [] OTHER -> 3, Len(<<1>>)} \cup (Len(<<1>>) \ (0 .. 0))) |-> Cardinality({b15199 \in {2 : b15200 \in {1, 2}} : <<7, 7>>})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b15198 \\in {1, 2} \\cup 1 \\ 0..0 |-> <expression line 14, col 106 to line 14, col 165 of module random_09794>]"
---*)
