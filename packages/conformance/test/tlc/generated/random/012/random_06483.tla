(*---
description: Evaluates a random function expression, seed 262, number 6483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9973 \in (((0 .. -1) \ ({1} \cup {x \in 1..3 : x > 1})) \cup UNION {(7 .. 7), (-1 .. 3)}) |-> (-([a |-> -1, b |-> FALSE]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-1 :> 1 @@ 0 :> 1 @@ 1 :> 1 @@ 2 :> 1 @@ 3 :> 1 @@ 7 :> 1)"
---*)
