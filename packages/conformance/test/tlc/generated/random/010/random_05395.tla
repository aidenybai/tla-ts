(*---
description: Evaluates a random seq expression, seed 262, number 5395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(Head(<<>>) \div (-1 - 0)), ((2 \div 1) \div IF TRUE THEN 2 ELSE SUBSET {1})>>, CASE ((CHOOSE r \in [a : {1}] : TRUE) = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)) -> CASE (\A b8348 \in <<5, 6>> : FALSE) -> Cardinality({}) [] OTHER -> (3 \div 2) [] OTHER -> ((<<3, 1, 2>> + [x \in 1..2 |-> x]) + ((1 :> 2))[2])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05395 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
