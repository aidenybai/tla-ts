(*---
description: Evaluates a random bool expression, seed 262, number 5345.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05345 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b8260 \in {b8261 \in <<>> : FALSE} : (TRUE = -1)) \/ (([a |-> 1, b |-> TRUE] = [a |-> 1]) => (<<>> => FALSE))) <=> (SubSeq((<<1, 2>> \o TRUE), (1 - 2), CASE FALSE -> 1 [] OTHER -> 2147483647) = ((2147483647 :> 2147483647) @@ (<<5, 6>> @@ (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05345 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    <<>>
    is not enumerable
---*)
