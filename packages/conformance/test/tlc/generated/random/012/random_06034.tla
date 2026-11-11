(*---
description: Evaluates a random seq expression, seed 262, number 6034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SortSeq(Append(<<3, 1, 2>>, -1), LAMBDA p, q : p < q) \o Append(Append(<<>>, 3), CASE TRUE -> 2 [] OTHER -> 7)) EXCEPT ![1] = IF ((3 \in {x \in 1..3 : x > 1}) => (~TRUE)) THEN ((<<5, 6>>)[7] % (<<5, 6>>)[0]) ELSE ([a |-> 2, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1, 2, 3, 3, 2>>"
---*)
