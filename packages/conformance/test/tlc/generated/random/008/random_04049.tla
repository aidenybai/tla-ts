(*---
description: Evaluates a random int expression, seed 262, number 4049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 7]).a \in ((Nat \ Nat) \cap {3, 0})) => (\A b6376 \in ({b6377 \in {1, 2} : FALSE} \cap (<<3, 1, 2>> .. 1)) : ((CHOOSE b6378 \in [x \in Nat |-> x + 1] : TRUE) \in DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
