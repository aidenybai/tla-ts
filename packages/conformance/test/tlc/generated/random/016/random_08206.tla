(*---
description: Evaluates a random record expression, seed 262, number 8206.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08206 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality((DOMAIN [x \in 1..2 |-> x] \ (2 .. -1))), b |-> (\A b12697 \in {Cardinality(2..1) : b12698 \in {b12699 \in Nat : TRUE}} : ({b12700 \in {} : FALSE} = (2..1 \ {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08206 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
