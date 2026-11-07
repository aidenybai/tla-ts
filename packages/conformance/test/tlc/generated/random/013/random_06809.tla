(*---
description: Evaluates a random int expression, seed 262, number 6809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((0 = [a |-> 1]) <=> (SUBSET {1} \subseteq 2..1)) -> IF (FALSE <=> TRUE) THEN IF TRUE THEN 2147483647 ELSE 7 ELSE Cardinality({1, 2}) [] OTHER -> Len(<<0, 2147483647>>) + [[DOMAIN (1 :> 2) EXCEPT !.a = ([a |-> 1]).a] EXCEPT !.a = @ + (-(2 - (1 :> 2)))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06809 failed.
    Attempted to check equality of integer 0 with non-integer:
    [a |-> 1]
---*)
