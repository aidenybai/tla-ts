(*---
description: Evaluates a random function expression, seed 262, number 9704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE CASE (\A b15057 \in {1} : b15057) -> (7 + 2) [] OTHER -> (7 * 7) -> (([x \in 1..2 |-> x])[-1] % LET b15058 == <<1>> IN <<>>) [] OTHER -> IF [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] THEN Head(<<1>>) ELSE LET b15059 == 1 IN 0 = (-(CHOOSE b15060 \in {b15061 \in Nat : TRUE} : ({1} \subseteq {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09704 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 28 to line 14, col 53 of module random_09704
---*)
