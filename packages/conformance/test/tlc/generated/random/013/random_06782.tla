(*---
description: Evaluates a random record expression, seed 262, number 6782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SubSeq(<<>>, 1, 0)), b |-> ({b10401 \in {} : TRUE} = ([x \in 1..2 |-> x] @@ <<5, 6>>))] EXCEPT !.a = @ + IF ((3 < <<5, 6>>) \/ (\A b10402 \in SUBSET {1} : FALSE)) THEN Cardinality(UNION {<<1>>, {1}}) ELSE CASE (\E b10403 \in {} : FALSE) -> ([a |-> 1]).a [] OTHER -> Head(<<1, 2>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06782 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
