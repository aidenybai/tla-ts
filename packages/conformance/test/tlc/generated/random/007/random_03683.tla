(*---
description: Evaluates a random set expression, seed 262, number 3683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {Append(SelectSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA e : e > 0), (([a |-> 1]).a % (2 % -1))), ((DOMAIN (1 :> 2) \cup UNION {{x \in 1..3 : x > 1}, {1}}) \cup {b5818 \in (2147483647 .. 0) : (<<5, 6>> @@ <<5, 6>>)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
