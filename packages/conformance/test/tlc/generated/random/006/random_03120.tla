(*---
description: Evaluates a random function expression, seed 262, number 3120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4983 \in (CHOOSE r \in [a : {2, 1, 3}] : TRUE) |-> (CHOOSE b4984 \in {b4985 \in DOMAIN <<5, 6>> : (\A b4986 \in {2, 1, 3} : FALSE)} : (Cardinality({2, 1, 3}) \in DOMAIN [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b4983 \\in [a |-> 1] |-> <expression line 14, col 70 to line 14, col 208 of module random_03120>]"
---*)
