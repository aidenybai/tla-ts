(*---
description: Evaluates a random seq expression, seed 262, number 330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append((SelectSeq(<<>>, LAMBDA e : e > 0) \o SubSeq(<<1>>, 3, 1)), (IF TRUE THEN 2147483647 ELSE 7 % CASE [a |-> 1, b |-> TRUE] -> 7 [] OTHER -> 2147483647)), [a |-> CASE (FALSE => FALSE) -> (-2147483647) [] OTHER -> Cardinality(1..3), b |-> ((<<>> = (1 :> 2)) /\ (2147483647 \in <<1>>))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647, [a |-> -2147483647, b |-> FALSE]>>"
---*)
