(*---
description: Evaluates a random int expression, seed 262, number 1327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (Head(<<3, 1, 2>>) = LET b2125 == 3 IN b2125) THEN (\E b2126 \in ({} \ 2..1) : ({x \in 1..3 : x > 1} \subseteq 1..3)) ELSE Head(Tail(<<1, 2>>)) - CASE ((\A b2127 \in {} : FALSE) /\ (0 \in {x \in 1..3 : x > 1})) -> ((2 :> 2) + Head(<<1, 2>>)) [] OTHER -> Cardinality({b2128 \in {1} : FALSE})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
