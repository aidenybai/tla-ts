(*---
description: Evaluates a random bool expression, seed 262, number 2677.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02677 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b4230 \in (UNION {(SUBSET {1} \ 2..1), (3 .. 1)} \cup (({1} \cup {x \in 1..3 : x > 1}) \cup ({2, 1, 3} \cap {}))) : (\E b4231 \in LET b4232 == (-b4230) IN ((1 :> 2))[b4232] : (({1, 2} \ Nat) \subseteq (b4231 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02677 failed.
    Attempted to compare the set {} with the value:
    2
---*)
