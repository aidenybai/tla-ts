(*---
description: Evaluates a random int expression, seed 262, number 2465.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02465 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((([x \in 1..2 |-> x])[1] = (-3)) /\ ((2147483647 \in (1 :> 2)) \/ (\E b3884 \in {x \in 1..3 : x > 1} : TRUE))) -> Head(SubSeq((<<1>> \o <<3, 1, 2>>), ([a |-> 1]).a, (-2147483647))) [] OTHER -> (Cardinality(DOMAIN <<5, 6>>) + ((7 - 0) + Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 12"
---*)
