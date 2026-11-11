(*---
description: Evaluates a random set expression, seed 262, number 5231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b8105 == (Len(<<3, 1, 2>>) + (b8104 % 7)) IN Len(SortSeq(<<>>, LAMBDA p, q : p < q)) : b8104 \in (DOMAIN ((1 :> 2) @@ <<5, 6>>) \cap {b8106 \in DOMAIN [x \in 1..2 |-> x] : (b8106 \in 2..1)})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
