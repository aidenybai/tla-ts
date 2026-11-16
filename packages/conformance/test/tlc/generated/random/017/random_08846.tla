(*---
description: Evaluates a random seq expression, seed 262, number 8846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13695 \in ((CHOOSE b13696 \in ({} \cup 1..3) : (~FALSE)) \ ((2 \div 3) .. Len(<<1>>))) |-> (CASE (TRUE <=> {2, 1, 3}) -> {b13697 \in SUBSET {1} : TRUE} [] OTHER -> Head(<<1, 2>>) \div (([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))[CASE TRUE -> 1 [] OTHER -> 0])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b13695 \\in 1 \\ 0..1 |-> <expression line 14, col 110 to line 14, col 278 of module random_08846>]"
---*)
