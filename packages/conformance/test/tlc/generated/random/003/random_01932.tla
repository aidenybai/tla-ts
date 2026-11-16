(*---
description: Evaluates a random seq expression, seed 262, number 1932.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01932 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(([b3037 \in DOMAIN [x \in Nat |-> x + 1] |-> Len(<<1>>)])[IF ([a |-> 1] /\ TRUE) THEN Cardinality(2..1) ELSE Head(<<>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01932 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a record.
    line 14, col 83 to line 14, col 99 of module random_01932
---*)
