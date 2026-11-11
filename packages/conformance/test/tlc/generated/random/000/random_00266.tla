(*---
description: Evaluates a random bool expression, seed 262, number 266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b444 \in ({LET b445 == 0 IN 7, ([a |-> 1]).a} \cap {b446 \in ({1} \cup {x \in 1..3 : x > 1}) : (\E b447 \in 1..3 : TRUE)}) : (\A b448 \in UNION {{<<1, 2>> : b449 \in b444}, DOMAIN (1 :> 2)} : ((<<>> = [a |-> 1, b |-> TRUE]) => ({2, 1, 3} \subseteq {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00266 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    line 14, col 186 to line 14, col 189 of module random_00266
---*)
