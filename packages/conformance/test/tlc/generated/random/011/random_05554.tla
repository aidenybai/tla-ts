(*---
description: Evaluates a random seq expression, seed 262, number 5554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Len(SelectSeq(Append(<<1, 2>>, 7), LAMBDA e : e > 0)), IF ({1, -1} \subseteq UNION {2..1, 1..3}) THEN LET b8591 == (CHOOSE b8592 \in {x \in 1..3 : x > 1} : TRUE) IN (3 * 2147483647) ELSE Cardinality((1..3 \ 2..1))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 3>>"
---*)
