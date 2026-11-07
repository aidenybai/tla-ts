(*---
description: Evaluates a random set expression, seed 262, number 5507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0)) : b8509 \in {b8510 \in {(CHOOSE b8512 \in {x \in 1..3 : x > 1} : 2..1) : b8511 \in UNION {{1, 2}, {1, 2}}} : ([FALSE EXCEPT !.a = b8510] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 89 to line 14, col 132 of module random_05507
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 89 to line 14, col 132 of module random_05507
---*)
