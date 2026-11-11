(*---
description: Evaluates a random int expression, seed 262, number 3947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (IF TRUE THEN 2 ELSE 2147483647 = [b6210 \in 1..3 |-> b6210]) THEN IF ({1} = SUBSET {1}) THEN IF TRUE THEN 2147483647 ELSE 2 ELSE IF FALSE THEN 2 ELSE 0 ELSE ((CHOOSE r \in [a : 1..2] : TRUE)).a, b |-> ((Len(<<3, 1, 2>>) - (2 - 2)) \in (UNION {1..3, 1..3} \cup (2147483647 .. 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03947 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 23 to line 14, col 219 of module random_03947
---*)
