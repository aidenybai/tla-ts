(*---
description: Evaluates a random seq expression, seed 262, number 9851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(({7 : b15295 \in {x \in 1..3 : x > 1}} \ (7 .. 1))), ((([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ [<<1>> EXCEPT ![FALSE] = 3]))[(-([a |-> 1, b |-> TRUE]).a)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {7}
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {7}
---*)
