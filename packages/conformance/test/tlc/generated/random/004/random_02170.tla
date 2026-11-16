(*---
description: Evaluates a random function expression, seed 262, number 2170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ({b3425 \in {} : TRUE} = ({x \in 1..3 : x > 1} \ 2..1)) THEN (CASE FALSE -> 7 [] OTHER -> 2147483647 * CASE TRUE -> 0 [] OTHER -> -1) ELSE Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) :> SortSeq((SelectSeq(<<1>>, LAMBDA e : e > 0) \o Append(<<1>>, 7)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (3 :> <<1, 1, 7>>)"
---*)
