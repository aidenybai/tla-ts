(*---
description: Evaluates a random function expression, seed 262, number 6841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10482 \in {(-(-7)), (([a |-> 1, b |-> TRUE]).a * (3 + 2147483647))} |-> ([[b10483 \in {1} |-> 7] EXCEPT ![((1 :> 2))[2]] = ([a |-> 1, b |-> TRUE]).a])[LET b10484 == CASE FALSE -> b10482 [] OTHER -> b10482 IN Cardinality({2, 1, 3})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3+2147483647
    2178:0 Overflow when computing 3+2147483647
---*)
