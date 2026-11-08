(*---
description: Evaluates a random set expression, seed 262, number 4138.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04138 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (\A b6514 \in (1..3 \cup {2, 1, 3}) : (~FALSE)) -> LET b6515 == [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] IN ([x \in Nat |-> x + 1])[b6515] [] OTHER -> ((CHOOSE b6516 \in {} : FALSE) + (CHOOSE b6517 \in {1, 2} : FALSE)), (((-1)).a + (IF TRUE THEN <<1>> ELSE 2 * IF FALSE THEN 2 ELSE -1))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04138 failed.
    2158:0 Attempted to check if the value:
    [a |-> 2, b |-> TRUE]
    is an element of Nat.
---*)
