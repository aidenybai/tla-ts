(*---
description: Evaluates a random set expression, seed 262, number 527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(LET b889 == 2147483647 IN 1 \div (1 * b888)) : b888 \in (DOMAIN [x \in 1..2 |-> x] \cup UNION {(1 :> 2), 2..1})} \cup (({1, 7} \cup ({2, 1, 3} \cup SUBSET {1})) \ UNION {({1} \ {1, 2}), {b890 \in {1, 2} : FALSE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00527 failed.
    Attempted to compare the set {} with the value:
    <<2>>
---*)
