(*---
description: Evaluates a random seq expression, seed 262, number 73.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-CASE (TRUE <=> FALSE) -> (CHOOSE b107 \in 2..1 : FALSE) [] OTHER -> (2147483647 - 2147483647)), IF ((FALSE = 0) <=> (FALSE \/ FALSE)) THEN (Len(<<1>>) \div (1 - -1)) ELSE IF (~TRUE) THEN Cardinality({1}) ELSE Len(<<1>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00073 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    0
---*)
