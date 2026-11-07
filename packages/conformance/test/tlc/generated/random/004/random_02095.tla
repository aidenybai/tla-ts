(*---
description: Evaluates a random set expression, seed 262, number 2095.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02095 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {[[[x \in 1..2 |-> x] EXCEPT ![2] = 2147483647] EXCEPT ![(2147483647 + 1)] = CASE TRUE -> 0 [] OTHER -> 1], ({2147483647, 2147483647} \ {b3334 \in {1, 2} : FALSE})} \ (Cardinality((2..1 \cup {x \in 1..3 : x > 1})) .. (Cardinality({x \in 1..3 : x > 1}) \div ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
