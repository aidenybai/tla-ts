(*---
description: Evaluates a random record expression, seed 262, number 9950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(<<(<<1, 2>> \o <<1>>), (-2147483647)>>), b |-> (((FALSE \/ FALSE) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) <=> ((\A b15476 \in SUBSET {1} : TRUE) /\ ({x \in 1..3 : x > 1} = 1..3)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> <<1, 2, 1>>, b |-> FALSE]"
---*)
