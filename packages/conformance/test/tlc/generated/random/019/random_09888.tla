(*---
description: Evaluates a random bool expression, seed 262, number 9888.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09888 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 + 3) = IF FALSE THEN 0 ELSE -1) => (({1} \cap 2..1) \subseteq {0 : b15371 \in {x \in 1..3 : x > 1}})) => (((\A b15372 \in 2..1 : TRUE) => (2..1 \subseteq [a |-> 1])) <=> (Len(<<>>) = CASE TRUE -> -1 [] OTHER -> 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
