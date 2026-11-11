(*---
description: Evaluates a random record expression, seed 262, number 2203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = ((CHOOSE b3461 \in UNION {1..3, {1}} : (FALSE = <<5, 6>>)) * CASE (<<1>> = <<1>>) -> (1 + 2147483647) [] OTHER -> Len(<<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02203 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    <<5, 6>>
---*)
