(*---
description: Evaluates a random bool expression, seed 262, number 1197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b1925 \in (Head(Tail(<<1>>)) .. (LET b1926 == 2147483647 IN 0 \div Head(<<1, 2>>))) : ((IF TRUE THEN b1925 ELSE [a |-> 1] * ([a |-> 1, b |-> TRUE]).a) \in DOMAIN ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
