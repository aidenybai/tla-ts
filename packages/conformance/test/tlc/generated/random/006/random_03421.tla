(*---
description: Evaluates a random record expression, seed 262, number 3421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b5430 \in ({1, -1} \ ({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1})) : ((2..1 \ {1, 2}) \subseteq {b5430, 3}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
