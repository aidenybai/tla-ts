(*---
description: Evaluates a random seq expression, seed 262, number 5297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(([<<-1, -1>> EXCEPT ![1] = (2 * 2147483647)] \o ((1..3 \cap {}) \ {b8202 : b8202 \in {2, 1, 3}})), (Cardinality((SUBSET {1} \cup 2..1)) - Head(SelectSeq(<<1>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*2147483647
    2178:0 Overflow when computing 2*2147483647
---*)
