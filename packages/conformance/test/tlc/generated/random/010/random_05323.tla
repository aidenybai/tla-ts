(*---
description: Evaluates a random function expression, seed 262, number 5323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8234 \in ((DOMAIN [x \in Nat |-> x + 1] \cup (2..1 \ {})) \ {Cardinality({x \in 1..3 : x > 1}), Len(<<1, 2>>)}) |-> (CASE (FALSE \/ FALSE) -> (b8234 + b8234) [] OTHER -> Head(<<3, 1, 2>>) \div ((<<5, 6>> @@ <<5, 6>>))[((1 :> 2))[3]])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b8234 \\in Nat \\ {2} |-> <expression line 14, col 135 to line 14, col 249 of module random_05323>]"
---*)
