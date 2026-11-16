(*---
description: Evaluates a random function expression, seed 262, number 3998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6286 \in DOMAIN [b6287 \in {b6288 \in {x \in 1..3 : x > 1} : FALSE} |-> ((1 :> 2))[-1]] |-> IF (SelectSeq(<<>>, LAMBDA e : e > 0) = (b6286 :> -1)) THEN SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) ELSE Head(Append(<<3, 1, 2>>, -1))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
