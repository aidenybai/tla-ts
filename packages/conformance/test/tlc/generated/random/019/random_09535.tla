(*---
description: Evaluates a random seq expression, seed 262, number 9535.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09535 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<LET b14818 == (2..1 \div 0) IN CASE FALSE -> b14818 [] OTHER -> b14818, Cardinality({2, 7})>>, ([(0 :> 1) EXCEPT ![LET b14819 == [a |-> 1] IN [a |-> 1]] = CASE TRUE -> 7 [] OTHER -> 1])[(Head(<<>>) * (<<1, 2>> - <<1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
