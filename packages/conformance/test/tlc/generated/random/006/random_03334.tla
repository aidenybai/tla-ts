(*---
description: Evaluates a random set expression, seed 262, number 3334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Head(<<>>) \div (0 \div 0)), CASE (<<>> = (1 :> 2)) -> (FALSE \/ TRUE) [] OTHER -> (2 \div 7)} \cap ({b5298 \in {b5299 \in Nat : FALSE} : (TRUE /\ FALSE)} \cup (({} \cap {1}) = (2..1 \cap 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
