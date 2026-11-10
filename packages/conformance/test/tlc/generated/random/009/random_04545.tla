(*---
description: Evaluates a random seq expression, seed 262, number 4545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CASE (2147483647 < 3) -> (-0) [] OTHER -> Cardinality({1, 2}) - Head(Append(<<>>, 7))), Cardinality(DOMAIN ((1 :> 2) @@ <<5, 6>>))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-5, 2}"
---*)
