(*---
description: Evaluates a random bool expression, seed 262, number 5411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7 : b8381 \in 2..1} \ {-1 : b8382 \in {1}}) \cap (({2, 1, 3} \cap {1, 2}) \ DOMAIN [x \in 1..2 |-> x])) \subseteq {CASE (\A b8384 \in {} : FALSE) -> Cardinality(Nat) [] OTHER -> Len(<<5, 6>>) : b8383 \in ([<<3, 1, 2>> EXCEPT ![1] = 1] = (3 :> 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05411 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 225 to line 14, col 264 of module random_05411
---*)
