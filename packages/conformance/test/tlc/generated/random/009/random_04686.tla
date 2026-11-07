(*---
description: Evaluates a random seq expression, seed 262, number 4686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SortSeq(SubSeq(<<1, 2>>, 2, 2147483647), LAMBDA p, q : p < q), LAMBDA e : e > 0), ((CHOOSE r \in [a : 1..2] : TRUE)).a, IF (UNION {Nat, [a |-> 1]} = {b7325 : b7325 \in SUBSET {1}}) THEN ((<<5, 6>>)[7] + (2147483647 + [a |-> 1])) ELSE ((2 @@ <<5, 6>>))[CASE TRUE -> -1 [] OTHER -> 2147483647]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    2147483647
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    2147483647
---*)
