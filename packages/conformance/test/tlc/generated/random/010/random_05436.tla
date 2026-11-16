(*---
description: Evaluates a random bool expression, seed 262, number 5436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((3 :> 0))[SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)] * ((-1 * 2) % CASE FALSE -> 1 [] OTHER -> 3)), b |-> ((IF FALSE THEN FALSE ELSE 1 + (CHOOSE b8418 \in {1, 2} : TRUE)) = (-(CHOOSE b8419 \in 2..1 : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05436 failed.
    Attempted to check equality of integer 3 with non-integer:
    <<1, 2, 3>>
---*)
