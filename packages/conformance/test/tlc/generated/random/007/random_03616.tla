(*---
description: Evaluates a random int expression, seed 262, number 3616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5708 == ((CHOOSE b5709 \in ({x \in 1..3 : x > 1} \cap {1}) : ({2, 1, 3} \subseteq {})) \div (([a |-> 1, b |-> TRUE]).a - IF <<1>> THEN 0 ELSE 2147483647)) IN ([b5710 \in {2147483647 : b5711 \in FALSE} |-> (3 * 0)] \div Len(SubSeq(<<3, 1, 2>>, b5708, 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03616 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 215 to line 14, col 219 of module random_03616
---*)
