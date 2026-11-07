(*---
description: Evaluates a random record expression, seed 262, number 6253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = Cardinality({})] EXCEPT !.a = (Head(<<1>>) \div (2147483647 \div 0))] EXCEPT !.a = (([[x \in Nat |-> x + 1] EXCEPT ![2] = -1])[(CHOOSE b9636 \in {x \in 1..3 : x > 1} : FALSE)] - Head((<<3, 1, 2>> \o <<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
