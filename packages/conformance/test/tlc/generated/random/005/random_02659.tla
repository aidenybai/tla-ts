(*---
description: Evaluates a random function expression, seed 262, number 2659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4195 \in UNION {{[<<1>> EXCEPT ![1] = 1], (-1 \div 2147483647)}, {b4196 \in {2147483647, 2147483647} : (3 \in {1, 2})}} |-> Cardinality({Head(<<3, 1, 2>>), Cardinality(Nat)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02659 failed.
    Attempted to check equality of the function <<1>> with the value:
    0
---*)
