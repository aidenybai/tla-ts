(*---
description: Evaluates a random record expression, seed 262, number 6930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (CHOOSE b10609 \in {(b10610 * b10610) : b10610 \in UNION {1..3, {2, 1, 3}}} : ((b10609 = b10609) \/ ({2, 1, 3} = Nat)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
