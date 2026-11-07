(*---
description: Evaluates a random function expression, seed 262, number 7126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10941 \in (Head(Append(<<3, 1, 2>>, 1)) .. CASE (~FALSE) -> (0 * 7) [] OTHER -> Cardinality({})) |-> (Head(Tail(<<3, 1, 2>>)) * (CHOOSE b10942 \in DOMAIN [x \in 1..2 |-> x] : (b10942 = b10941)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
