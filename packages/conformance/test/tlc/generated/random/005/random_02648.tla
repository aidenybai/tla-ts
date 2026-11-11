(*---
description: Evaluates a random bool expression, seed 262, number 2648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b4175 \in {b4176 \in ({b4177 : b4177 \in {x \in 1..3 : x > 1}} \cup {1, 3}) : ({b4178 \in {2, 1, 3} : FALSE} = ({1, 2} \cap {2, 1, 3}))} : (((Nat \cup [a |-> 1, b |-> TRUE]) \ (1..3 \ 1..3)) = {(b4175 * b4175) : b4179 \in {2147483647, -1}})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
