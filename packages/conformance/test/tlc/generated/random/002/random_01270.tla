(*---
description: Evaluates a random function expression, seed 262, number 1270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE) @@ [b2027 \in {} |-> b2027]) @@ (Head(<<1>>) :> (CHOOSE b2028 \in {1} : TRUE))) @@ [b2029 \in {([a |-> 1, b |-> TRUE]).a, CASE TRUE -> 2147483647 [] OTHER -> 7} |-> Len(SubSeq(<<1, 2>>, 7, b2029))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
---*)
