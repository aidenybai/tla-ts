(*---
description: Evaluates a random function expression, seed 262, number 2107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b3346 \in {(7 % 7), CASE TRUE -> 2147483647 [] OTHER -> 3} |-> ([a |-> FALSE, b |-> Nat]).a] @@ [b3347 \in (({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1}) \cap {7 : b3348 \in {2, 1, 3}}) |-> CASE (\E b3349 \in <<1>> : TRUE) -> (2 - -1) [] OTHER -> (2 - [x \in Nat |-> x + 1])]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> FALSE @@ 2147483647 :> FALSE)"
---*)
