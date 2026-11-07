(*---
description: Evaluates a random function expression, seed 262, number 5210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b8082 \in {0, 2147483647} |-> (b8082 + b8082)] @@ ((2 :> 2) @@ [<<5, 6>> EXCEPT ![1] = 3])) @@ [[b8083 \in {b8084 \in {x \in 1..3 : x > 1} : TRUE} |-> Cardinality(1..3)] EXCEPT ![Len(SelectSeq({}, LAMBDA e : e > 0))] = (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2147483647
    2178:0 Overflow when computing 2147483647+2147483647
---*)
