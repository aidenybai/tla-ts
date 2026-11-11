(*---
description: Evaluates a random seq expression, seed 262, number 2537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b3999 == IF ({1, 2} \subseteq {x \in 1..3 : x > 1}) THEN (2 - 1) ELSE CASE FALSE -> 2 [] OTHER -> 2 IN Cardinality(({1} \ {2, 1, 3})), Head(Tail(<<0, -1>>))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, -1>>"
---*)
