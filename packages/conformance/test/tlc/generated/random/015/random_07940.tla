(*---
description: Evaluates a random seq expression, seed 262, number 7940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (CASE (TRUE <=> TRUE) -> Head(<<1, 2>>) [] OTHER -> IF TRUE THEN 3 ELSE -1 % CASE (<<1>> = [x \in 1..2 |-> x]) -> (2147483647 * 2147483647) [] OTHER -> (0 % [a |-> 1, b |-> TRUE]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
