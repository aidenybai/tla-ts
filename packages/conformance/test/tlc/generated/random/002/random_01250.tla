(*---
description: Evaluates a random record expression, seed 262, number 1250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a, b |-> (~([a |-> 1] = <<1, 2>>))] EXCEPT !.a = (CASE (\E b2001 \in FALSE : FALSE) -> (-1 + -1) [] OTHER -> IF FALSE THEN 7 ELSE 2147483647 - ((3 * 1) - (0 % -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01250 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<1, 2>>
---*)
