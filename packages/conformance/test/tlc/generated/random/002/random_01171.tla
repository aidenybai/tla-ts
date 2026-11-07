(*---
description: Evaluates a random function expression, seed 262, number 1171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1876 \in (DOMAIN (<<5, 6>> @@ [x \in 1..2 |-> x]) \cap {b1877 \in DOMAIN (1 :> 2) : (-1 < TRUE)}) |-> (((<<5, 6>> \o <<1>>) :> (-1 - 1..3))).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    TRUE
    2266:0 The second argument of < should be an integer, but instead it is:
    TRUE
---*)
