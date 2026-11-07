(*---
description: Evaluates a random set expression, seed 262, number 3121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((-1 \div 0) .. (<<>> \o <<1>>)) \cup (UNION {{1}, Nat} \ {0 : b4987 \in 2..1})), {b4988 \in (UNION {2..1, 2147483647} \cup {b4989 \in 2..1 : FALSE}) : (([a |-> 1, b |-> TRUE] = [a |-> 1]) => ({x \in 1..3 : x > 1} \subseteq {1, 2}))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
