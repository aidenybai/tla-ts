(*---
description: Evaluates a random int expression, seed 262, number 2888.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02888 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((~(0 = 1)) => (~(SUBSET {1} = SUBSET {1}))) THEN (-(([a |-> 1, b |-> TRUE]).a % CASE FALSE -> -1 [] OTHER -> 2)) ELSE CASE (<<0, 2>> = (CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE)) -> Cardinality((7 .. 3)) [] OTHER -> [a |-> ([x \in Nat |-> x + 1])[1], b |-> (7 < 7)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> FALSE]"
---*)
