(*---
description: Evaluates a random set expression, seed 262, number 3483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE (~(TRUE => <<>>)) -> ((CHOOSE b5502 \in SUBSET {1} : FALSE) + IF FALSE THEN 7 ELSE 2) [] OTHER -> (Head(<<3, 1, 2>>) - ([x \in Nat |-> x + 1])[2]), (-(CHOOSE b5503 \in UNION {{1, 2}, {1}} : (TRUE => FALSE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03483 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a tuple.
    line 14, col 26 to line 14, col 37 of module random_03483
---*)
