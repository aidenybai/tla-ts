(*---
description: Evaluates a random seq expression, seed 262, number 1999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = Cardinality({x \in 1..3 : x > 1})]), (-Cardinality(({x \in 1..3 : x > 1} \cup {1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-3>>"
---*)
