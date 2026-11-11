(*---
description: Evaluates a random function expression, seed 262, number 2297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3627 \in {CASE ({2, 1, 3} \subseteq {x \in 1..3 : x > 1}) -> (CHOOSE b3628 \in {1} : FALSE) [] OTHER -> Head(<<3, 1, 2>>), LET b3629 == Len(<<3, 1, 2>>) IN (CHOOSE b3630 \in {1} : TRUE)} |-> [a |-> IF ({} = {1}) THEN ([a |-> 1]).a ELSE (b3627 \div b3627), b |-> ((b3627 + 1) < CASE FALSE -> b3627 [] OTHER -> b3627)]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> [a |-> 1, b |-> FALSE] @@ 3 :> [a |-> 1, b |-> FALSE])"
---*)
