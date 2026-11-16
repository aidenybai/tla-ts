(*---
description: Evaluates a random bool expression, seed 262, number 1225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b1969 \in DOMAIN [x \in Nat |-> x + 1] : (0 \in 0)} \subseteq {b1970 \in {2147483647, 7} : (\A b1971 \in {} : FALSE)}) <=> (((<<1>> \o <<>>) \o <<1, 2147483647>>) = ([b1972 \in {1, 2} |-> b1972] @@ [b1973 \in {x \in 1..3 : x > 1} |-> -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01225 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
