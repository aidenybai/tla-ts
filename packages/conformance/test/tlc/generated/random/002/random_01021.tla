(*---
description: Evaluates a random record expression, seed 262, number 1021.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b1648 \in DOMAIN [x \in 1..2 |-> x] : (TRUE <=> 0)) * ((<<1>>)[0] \div (2147483647 % 0))), b |-> (SubSeq(<<2, TRUE>>, Tail(<<1, 2>>), Len(<<1, 2>>)) = (((1 :> 2) @@ <<5, 6>>) @@ (<<5, 6>> @@ [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01021 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 71 to line 14, col 80 of module random_01021
---*)
