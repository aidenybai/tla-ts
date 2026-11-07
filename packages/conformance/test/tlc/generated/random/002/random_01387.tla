(*---
description: Evaluates a random function expression, seed 262, number 1387.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01387 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2212 \in ((CHOOSE f \in [{} -> 2..1] : TRUE) \cup {b2213 \in {1, 2} : FALSE}) |-> Cardinality(UNION {[a |-> 1, b |-> TRUE], 2..1})] @@ ((LET b2214 == 2147483647 IN b2214 + ([a |-> 1]).a) :> (-(1 % 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
