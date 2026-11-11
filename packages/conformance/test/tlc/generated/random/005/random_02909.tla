(*---
description: Evaluates a random set expression, seed 262, number 2909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CASE FALSE -> 3 [] OTHER -> 3 * (-3)) - (Head(<<1, 2>>) % Len(<<3, 1, 2>>))) : b4605 \in (DOMAIN (3 :> 1) \ {b4606 \in {3, 0} : ([a |-> 1] = [a |-> 1])})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
