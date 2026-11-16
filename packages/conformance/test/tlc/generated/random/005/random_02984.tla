(*---
description: Evaluates a random function expression, seed 262, number 2984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4737 \in {LET b4738 == 7 IN b4738, LET b4739 == 1 IN b4739} : (\E b4740 \in DOMAIN <<5, 6>> : ({1} \subseteq Nat))) :> ([[a |-> 7, b |-> FALSE] EXCEPT !.a = @ + Cardinality({})]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<7>>"
---*)
