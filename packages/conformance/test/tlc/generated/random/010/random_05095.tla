(*---
description: Evaluates a random function expression, seed 262, number 5095.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05095 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((<<5, 6>> @@ <<5, 6>>) @@ [[x \in 1..2 |-> x] EXCEPT ![1] = 2]) @@ [(CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE) EXCEPT ![(7 + 1)] = (3 \div 2)]) EXCEPT ![CASE ((FALSE \/ TRUE) <=> (<<3, 1, 2>> = (1 :> 2))) -> {(b7925 + b7925) : b7925 \in {<<5, 6>> : b7926 \in [a |-> 1, b |-> TRUE]}} [] OTHER -> (CHOOSE b7927 \in {1, 1} : (FALSE => TRUE))] = Head((SubSeq(<<1>>, [a |-> 1, b |-> TRUE], 7) \o Append(<<1, 2>>, 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 88 to line 14, col 125 of module random_05095
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05095 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
