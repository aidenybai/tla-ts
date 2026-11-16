(*---
description: Evaluates a random seq expression, seed 262, number 6437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<(-CASE FALSE -> 0 [] OTHER -> 3), IF (\A b9906 \in {2, 1, 3} : TRUE) THEN ((1 :> 2))[1] ELSE (2147483647 + 7)>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
