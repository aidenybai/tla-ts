(*---
description: Evaluates a random function expression, seed 262, number 6062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) @@ ((IF TRUE THEN 2 ELSE 7 * ([a |-> 1]).a) :> LET b9341 == (CHOOSE b9342 \in {2, 1, 3} : FALSE) IN CASE FALSE -> b9341 [] OTHER -> 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 0)"
---*)
