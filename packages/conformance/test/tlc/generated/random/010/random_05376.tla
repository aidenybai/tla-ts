(*---
description: Evaluates a random seq expression, seed 262, number 5376.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05376 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<IF (FALSE <=> TRUE) THEN Cardinality(SUBSET {1}) ELSE ([a |-> 1, b |-> TRUE]).a, (IF FALSE THEN 1 ELSE -1 * (3 + 1))>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-4>>"
---*)
