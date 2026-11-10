(*---
description: Evaluates a random set expression, seed 262, number 5657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SortSeq(Append(<<1, 2>>, 3), LAMBDA p, q : p < q)) : b8732 \in DOMAIN ((<<5, 6>> @@ <<1>>) @@ (CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {3}"
---*)
