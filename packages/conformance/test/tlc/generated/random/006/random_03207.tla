(*---
description: Evaluates a random set expression, seed 262, number 3207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (LET b5093 == CASE TRUE -> 1 [] OTHER -> 0 IN LET b5094 == b5093 IN -1 :> ([[a |-> 1] EXCEPT !.a = 3]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1}"
---*)
