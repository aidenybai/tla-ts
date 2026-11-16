(*---
description: Evaluates a random function expression, seed 262, number 79.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b120 \in {b121 \in (({1, 2} \cap 2..1) \cup (SUBSET {1} \cap 1..3)) : (\E b122 \in UNION {SUBSET {1}, {1}} : [b123 \in [x \in 1..2 |-> x] |-> b121])} |-> ([(<<5, 6>> @@ [x \in 1..2 |-> x]) EXCEPT ![(CHOOSE b124 \in {} : FALSE)] = Head(<<1>>)])[IF (b120 < 2147483647) THEN ([a |-> 1]).a ELSE Cardinality(1..3)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00079 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
