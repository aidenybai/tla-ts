(*---
description: Evaluates a random record expression, seed 262, number 5385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((FALSE /\ FALSE) /\ (-1 = 2147483647)) -> LET b8326 == (2147483647 - TRUE) IN (-b8326) [] OTHER -> Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), b |-> (({2, 2} \subseteq {FALSE : b8327 \in TRUE}) /\ (\A b8328 \in {b8329 \in 2..1 : FALSE} : ({2, 1, 3} => FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05385 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 221 to line 14, col 224 of module random_05385
---*)
