(*---
description: Evaluates a random int expression, seed 262, number 3936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([<<2, 1>> EXCEPT ![1] = (-1 - 1)] = (Cardinality({1}) :> (CHOOSE f \in [{} -> {0} \cup {1}] : TRUE))) THEN (\E b6198 \in (~(\A b6199 \in {} : [a |-> 1, b |-> TRUE])) : ((<<1, 2>> \o <<3, 1, 2>>) => (b6198 = 7))) ELSE IF ((<<1>> = [x \in 1..2 |-> x]) /\ (~TRUE)) THEN IF (FALSE \/ FALSE) THEN Head(<<1>>) ELSE Len(<<3, 1, 2>>) ELSE Len((<<1, 2>> \o <<1>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
