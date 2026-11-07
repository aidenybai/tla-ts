(*---
description: Evaluates a random set expression, seed 262, number 1069.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01069 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len(<<2147483647, 3>>) % Head(Tail(<<3, 1, 2>>))) : b1711 \in DOMAIN (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0}"
---*)
