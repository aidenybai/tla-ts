(*---
description: Evaluates a random int expression, seed 262, number 2136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Tail((TRUE \o <<1, 2>>)) = (([x \in Nat |-> x + 1])[-1] :> (<<1>> \o <<1>>))) -> CASE ((1..3 \cap 1..3) = {b3382 : b3382 \in Nat}) -> (Head(<<3, 1, 2>>) \div (2147483647 % [a |-> 1])) [] OTHER -> ((-1 + -1) % [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]) [] OTHER -> Cardinality(((2..1 \cap 2..1) \ {2, 3})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
---*)
