(*---
description: Evaluates a random set expression, seed 262, number 6083.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b9366 == LET b9367 == Append(<<1, 2>>, 2) IN (-1 - -1) IN CASE ({x \in 1..3 : x > 1} \subseteq Nat) -> CASE TRUE -> 0 [] OTHER -> b9366 [] OTHER -> (b9366 % 3) .. (CHOOSE b9368 \in ({b9369 \in Nat : TRUE} \ (-1 .. 7)) : ([a |-> b9368, b |-> TRUE] = [a |-> b9368, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
