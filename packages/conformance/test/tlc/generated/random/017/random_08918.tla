(*---
description: Evaluates a random function expression, seed 262, number 8918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13823 \in (({1, 2} \cap DOMAIN <<5, 6>>) \cap DOMAIN (0 :> 2)) |-> (Len([<<3, 1, 2>> EXCEPT ![1] = 0]) \div [b13824 \in ({} \ {x \in 1..3 : x > 1}) |-> Head(<<1, 2>>)])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
