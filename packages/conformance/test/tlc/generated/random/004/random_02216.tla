(*---
description: Evaluates a random seq expression, seed 262, number 2216.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02216 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(CHOOSE b3490 \in UNION {1..3, {1}} : ({1} \subseteq Nat)), LET b3491 == ([a |-> 1, b |-> TRUE]).a IN ([a |-> 1, b |-> TRUE]).a>> \o SortSeq([<<1, 2147483647>> EXCEPT ![1] = ([x \in Nat |-> x + 1])[0]], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 1, 2147483647>>"
---*)
