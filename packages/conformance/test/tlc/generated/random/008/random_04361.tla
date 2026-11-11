(*---
description: Evaluates a random int expression, seed 262, number 4361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<>>) :> (2147483647 - 2)))[(CHOOSE b6873 \in ({1} \cap <<5, 6>>) : (\A b6874 \in 1..3 : TRUE))] \div (CHOOSE b6875 \in UNION {({2, 1, 3} \cap {}), UNION {2..1, Nat}} : ((FALSE \/ TRUE) => Len(7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04361 failed.
    Attempted to check set membership in a tuple value.
---*)
