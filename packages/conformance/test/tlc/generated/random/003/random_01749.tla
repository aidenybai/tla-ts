(*---
description: Evaluates a random set expression, seed 262, number 1749.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01749 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head((<<b2778, b2778>> \o SortSeq([x \in 1..2 |-> x], LAMBDA p, q : p < q))) : b2778 \in ((UNION {{}, SUBSET {1}} \cup ({1} \cup Nat)) \cap (([a |-> 1]).a .. Cardinality(2..1)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
