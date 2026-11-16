(*---
description: Evaluates a random bool expression, seed 262, number 1418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> LET b2260 == (CHOOSE b2261 \in {2, 1, 3} : FALSE) IN CASE TRUE -> 7 [] OTHER -> 3, b |-> (Len(<<3, 1, 2>>) < Len(<<1>>))] = (CHOOSE r \in [a : 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
