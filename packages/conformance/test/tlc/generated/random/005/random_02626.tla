(*---
description: Evaluates a random seq expression, seed 262, number 2626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(([Append((1 :> 2), 2147483647) EXCEPT ![1] = (3 * 2147483647)] \o ((7 * 2147483647) \in (Nat \cap {}))), ((([x \in Nat |-> x + 1] @@ [a |-> 1, b |-> TRUE]) @@ ([x \in Nat |-> x + 1] @@ <<5, 6>>)))[((CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE))[(-2)]], ([b4137 \in {2147483647 : b4138 \in SUBSET {1}} |-> ((1 :> 2))[0]]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02626 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
