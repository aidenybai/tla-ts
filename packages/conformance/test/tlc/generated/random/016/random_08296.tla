(*---
description: Evaluates a random seq expression, seed 262, number 8296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq((SubSeq(<<3, 1, 2>>, 2147483647, 2147483647) \o Append(<<3, 1, 2>>, 2)), ((-3) % (2147483647 - -1)), (CHOOSE b12841 \in [a |-> 2147483647, b |-> FALSE] : ([a |-> 1, b |-> TRUE] = [a |-> 1]))), (Append([<<1, 2>> EXCEPT ![1] = 3], IF (1 :> 2) THEN [a |-> 1, b |-> TRUE] ELSE 2) % (CASE 3 -> 0 [] OTHER -> 3 * CASE FALSE -> 2147483647 [] OTHER -> 2)), Cardinality((Len(<<>>) .. ([x \in 1..2 |-> x])[3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08296 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
---*)
