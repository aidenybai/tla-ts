(*---
description: Evaluates a random set expression, seed 262, number 2036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3232 \in (Cardinality({b3233 \in {1} : FALSE}) .. (-LET b3234 == -1 IN 2147483647)) : ((\A b3235 \in {(1 :> 2), b3232} : ({x \in 1..3 : x > 1} = b3232)) => ((<<1>> = (1 :> 2)) \/ (-1 = b3232)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
