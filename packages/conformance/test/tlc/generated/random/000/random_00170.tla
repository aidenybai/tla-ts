(*---
description: Evaluates a random record expression, seed 262, number 170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(Append((<<1, 2>> \o <<1>>), Len(<<1>>))), b |-> (\A b272 \in ({b273 \in 1..3 : FALSE} \ ({1} \cup 1..3)) : ({b274 \in {} : FALSE} \subseteq (3 .. b272)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 4, b |-> TRUE]"
---*)
