(*---
description: Evaluates a random bool expression, seed 262, number 5440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8422 \in (\A b8423 \in (Head(<<1>>) :> (7 - 3)) : (({x \in 1..3 : x > 1} \cup {2, 1, 3}) = (1..3 \cap [x \in 1..2 |-> x]))) : (\A b8424 \in {(-1 \div 2147483647) : b8425 \in {0, -1}} : ((FALSE /\ TRUE) <=> (1 < b8424)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05440 failed.
    TLC encountered a non-enumerable quantifier bound
    <<4>>.
    line 14, col 45 to line 14, col 66 of module random_05440
---*)
