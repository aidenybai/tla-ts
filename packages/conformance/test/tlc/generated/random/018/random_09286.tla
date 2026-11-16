(*---
description: Evaluates a random function expression, seed 262, number 9286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14412 \in (({2147483647 : b14413 \in 2..1} \ {b14414 \in {x \in 1..3 : x > 1} : FALSE}) \cap {([a |-> 1]).a : b14415 \in (3 .. 3)}) |-> (((b14412 - b14412) + (b14412 + 7)) * (((1 :> 2) @@ [x \in 1..2 |-> x]))[(CHOOSE b14416 \in 2..1 : TRUE)])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
