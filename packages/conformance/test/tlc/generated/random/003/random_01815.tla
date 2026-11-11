(*---
description: Evaluates a random function expression, seed 262, number 1815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2878 \in {Len(Append(<<1, 2>>, 0)), (CASE FALSE -> 3 [] OTHER -> 3 \div (1 * 7))} |-> Len(Tail([<<1, 2>> EXCEPT ![1] = 3]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1 @@ 3 :> 1)"
---*)
