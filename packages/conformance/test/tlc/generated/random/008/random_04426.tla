(*---
description: Evaluates a random set expression, seed 262, number 4426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6961 \in {((b6962 + 2147483647) * Head(<<>>)) : b6962 \in {IF FALSE THEN 0 ELSE 0 : b6963 \in (7 .. 3)}} : (~(((1 :> 2))[1] < Len(<<1>>)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
