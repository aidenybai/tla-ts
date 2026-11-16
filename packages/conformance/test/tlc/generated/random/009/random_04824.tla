(*---
description: Evaluates a random function expression, seed 262, number 4824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7528 \in (({2147483647 : b7529 \in {x \in 1..3 : x > 1}} \cap (1 .. 7)) \cap ({b7530 \in {x \in 1..3 : x > 1} : TRUE} \cap DOMAIN (1 :> 2))) |-> Len(((1 * b7528) \in (-1 .. b7528)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
