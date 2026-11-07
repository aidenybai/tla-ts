(*---
description: Evaluates a random seq expression, seed 262, number 5179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq((<<1, 2>> \o <<1, 2>>), (\A b8036 \in {1} : TRUE), LET b8037 == 3 IN b8037) \o [SelectSeq([x \in 1..2 |-> x], LAMBDA e : e > 0) EXCEPT ![1] = [<<1>> EXCEPT ![1] = 3]]) \o <<((-7) * (CHOOSE b8038 \in {1, 2} : FALSE)), (DOMAIN <<5, 6>> \cap UNION {{1}, {1}})>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    TRUE
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
