(*---
description: Evaluates a random function expression, seed 262, number 9067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([(<<1>> \o <<3, 1, 2>>) EXCEPT ![1] = (-3)]) :> IF (\A b14094 \in (SUBSET {1} \ {2, 1, 3}) : (FALSE \/ FALSE)) THEN IF (1..3 = 2..1) THEN (7 % 3) ELSE (<<5, 6>>)[1] ELSE (CHOOSE b14095 \in Tail(<<3, 1, 2>>) : (<<>> = 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09067 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
