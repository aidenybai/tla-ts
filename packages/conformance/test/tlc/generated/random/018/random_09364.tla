(*---
description: Evaluates a random bool expression, seed 262, number 9364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (1 < 2) -> Len(<<3, 1, 2>>) [] OTHER -> (2147483647 + 1) \div (CASE TRUE -> -1 [] OTHER -> 1 % ([a |-> 1, b |-> TRUE]).a)) \in {b14535 \in ((2147483647 .. 2147483647) \cap {b14536 \in 2..1 : TRUE}) : ((-1 = b14535) \/ (<<>> = <<5, 6>>))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
