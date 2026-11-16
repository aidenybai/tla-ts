(*---
description: Evaluates a random record expression, seed 262, number 3881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([(2 :> 0) EXCEPT ![<<-1, 3>>] = IF FALSE THEN 0 ELSE 1])[Len(SortSeq(<<>>, LAMBDA p, q : p < q))], b |-> (((-1 - FALSE) .. DOMAIN [x \in 1..2 |-> x]) \subseteq (({2, 1, 3} \cap {}) \cap DOMAIN <<5, 6>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03881 failed.
    Attempted to check equality of integer 2 with non-integer:
    <<-1, 3>>
---*)
