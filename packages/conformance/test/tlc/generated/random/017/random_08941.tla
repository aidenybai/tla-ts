(*---
description: Evaluates a random seq expression, seed 262, number 8941.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08941 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SubSeq(Append(<<1>>, -1), (2147483647 + 2), ([a |-> 1, b |-> TRUE]).a), LAMBDA e : e > 0), ((Cardinality({1}) + [a |-> -1, b |-> TRUE]) + IF (~TRUE) THEN (3 % 2) ELSE (-1 * 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
