(*---
description: Evaluates a random set expression, seed 262, number 3437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5446 \in {(IF TRUE THEN 1 ELSE 2 \div (<<5, 6>>)[0]), ((1 + 1) - (3 % 3))} : (\A b5447 \in DOMAIN [b5448 \in 2..1 |-> -1] : [(1..3 = (1 :> 2)) EXCEPT !.a = (1 \div b5447)])})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
