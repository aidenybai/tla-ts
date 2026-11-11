(*---
description: Evaluates a random function expression, seed 262, number 7262.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07262 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1}] : TRUE) @@ [b11174 \in ({b11175 \in {1} : FALSE} \cap (-1 .. 2147483647)) |-> CASE (TRUE /\ (1 :> 2)) -> CASE TRUE -> b11174 [] OTHER -> 2147483647 [] OTHER -> (0 + 1)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
