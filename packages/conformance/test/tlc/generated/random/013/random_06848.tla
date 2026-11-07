(*---
description: Evaluates a random int expression, seed 262, number 6848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (SubSeq(SubSeq(<<1>>, 2147483647, 2147483647), ([x \in Nat |-> x + 1])[2147483647], Cardinality(Nat)) = [[[x \in 1..2 |-> x] EXCEPT ![7] = FALSE] EXCEPT ![(-1 - 7)] = LET b10501 == <<>> IN b10501]) -> ((-SelectSeq(<<>>, LAMBDA e : e > 0)) - (CHOOSE b10502 \in (2147483647 .. 1) : (TRUE \/ TRUE))) [] OTHER -> (((7 * 7)).a + ((-1 :> 7))[IF TRUE THEN -1 ELSE 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2147483647
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2147483647
---*)
