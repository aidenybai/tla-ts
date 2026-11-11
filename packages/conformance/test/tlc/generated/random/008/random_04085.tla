(*---
description: Evaluates a random int expression, seed 262, number 4085.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (1 \in SUBSET {1}) -> CASE FALSE -> 7 [] OTHER -> 3 [] OTHER -> (2 - 1) + CASE (\A b6421 \in {x \in 1..3 : x > 1} : TRUE) -> Cardinality({1, 2}) [] OTHER -> (<<>> = (1 :> 2))) + (Head([<<1>> EXCEPT ![1] = 2147483647]) - IF (\E b6422 \in 2..1 : FALSE) THEN Cardinality(1) ELSE Len(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04085 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
