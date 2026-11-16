(*---
description: Evaluates a random bool expression, seed 262, number 8782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13600 \in ([b13601 \in Nat |-> b13601] \cup <<1, 2147483647>>) : ((CHOOSE b13602 \in {x \in 1..3 : x > 1} : TRUE) = (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE))) \in {(CHOOSE b13603 \in UNION {SUBSET {1}, SUBSET {1}} : ([a |-> 1] = [a |-> 1])), ((CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE))[LET b13604 == 0 IN <<1>>]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08782 failed.
    Attempted to enumerate S \cup T when S:
    [b13601 \in Nat |-> <expression line 14, col 57 to line 14, col 62 of module random_08782>]
    and T:
    <<1, 2147483647>>
    are not both enumerable
---*)
