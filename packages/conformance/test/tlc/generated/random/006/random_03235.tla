(*---
description: Evaluates a random int expression, seed 262, number 3235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b5135 \in {b5136 \in ({x \in 1..3 : x > 1} \ {1}) : (b5136 \in {1})} : ((CHOOSE b5137 \in b5135 : [a |-> 1]) < Len(<<3, 1, 2>>))) THEN (-CASE (\A b5138 \in {} : [a |-> 1]) -> (-1 + 2) [] OTHER -> Append(<<>>, 2147483647)) ELSE CASE (([x \in Nat |-> x + 1] \ {}) = ({1} \ SUBSET {1})) -> CASE (2147483647 < -1) -> (CHOOSE b5139 \in 1..3 : FALSE) [] OTHER -> Len(<<3, 1, 2>>) [] OTHER -> (LET b5140 == 7 IN b5140 - (2 \div 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
