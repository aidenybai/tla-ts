(*---
description: Evaluates a random function expression, seed 262, number 8537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13229 \in ({b13230 \in {x \in 1..3 : x > 1} : TRUE} \cup ({1, 2} \cap {1, 2})) : (~(TRUE <=> FALSE))) < (Len((<<>> \o <<>>)) \div Len(SelectSeq(<<>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
