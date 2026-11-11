(*---
description: Evaluates a random seq expression, seed 262, number 9334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14482 \in ({LET b14484 == -1 IN -1 : b14483 \in ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})} = DOMAIN (1 :> 1)) |-> ((CASE TRUE -> 2147483647 [] OTHER -> b14482)[([a |-> 1, b |-> TRUE] * b14482)] + Head(Append(<<3, 1, 2>>, FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b14482 \\in FALSE |-> <expression line 14, col 137 to line 14, col 249 of module random_09334>]"
---*)
