(*---
description: Evaluates a random set expression, seed 262, number 5536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b8562 \in (IF FALSE THEN 2147483647 ELSE 7 :> (1 \div 0)) : (\E b8563 \in {0 : b8564 \in {x \in 1..3 : x > 1}} : (\A b8565 \in {} : TRUE))} \cap UNION {(([a |-> 1]).a .. Head(<<1>>)), (({1} \ {}) \cup DOMAIN [x \in 1..2 |-> x])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05536 failed.
    2179:0 The second argument of \div is 0.
---*)
