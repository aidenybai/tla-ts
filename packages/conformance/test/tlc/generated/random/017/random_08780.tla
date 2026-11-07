(*---
description: Evaluates a random seq expression, seed 262, number 8780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([a |-> ([x \in Nat |-> x + 1])[2147483647], b |-> (\E b13597 \in {2, 1, 3} : FALSE)]).a, (({1, 0} \ (Nat \cap SUBSET {1})) \cup UNION {({} \ {1}), (SUBSET {1} \cap {})})>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
