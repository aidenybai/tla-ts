(*---
description: Evaluates a random function expression, seed 262, number 2356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3731 \in (DOMAIN ((1 :> 2) @@ <<5, 6>>) \cup (IF <<1>> THEN 7 ELSE -1 .. IF FALSE THEN {} ELSE -1)) |-> LET b3732 == Cardinality({b3731, 0}) IN Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02356 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 64 to line 14, col 114 of module random_02356
---*)
