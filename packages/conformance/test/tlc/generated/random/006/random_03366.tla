(*---
description: Evaluates a random set expression, seed 262, number 3366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((b5345 < 0) /\ (2..1 = {x \in 1..3 : x > 1})) -> CASE ([a |-> 1] = [a |-> 1]) -> (2147483647 - 0) [] OTHER -> (-b5345) [] OTHER -> ((CHOOSE r \in [a : {1}] : TRUE)).a : b5345 \in {((2 + 3) + IF TRUE THEN -1 ELSE 2147483647), ((0 % 2147483647) \div Len(<<1, 2>>))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
