(*---
description: Evaluates a random record expression, seed 262, number 1617.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01617 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Cardinality(<<3, 1, 2>>), b |-> (<<>> = [x \in Nat |-> x + 1])] EXCEPT !.a = @ + Head((<<1>> \o <<3, 1, 2>>))] EXCEPT !.a = @ + CASE [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + Head(<<1, 2>>)] -> (Cardinality({x \in 1..3 : x > 1}) \div CASE FALSE -> 1 [] OTHER -> 7) [] OTHER -> (-Head(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
---*)
