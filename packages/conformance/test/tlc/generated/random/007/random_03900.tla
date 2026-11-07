(*---
description: Evaluates a random seq expression, seed 262, number 3900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(<<(-1 % 0), (CHOOSE b6137 \in {2, 1, 3} : TRUE)>>, LAMBDA e : e > 0), ((CHOOSE b6138 \in UNION {{1}, {1}} : (0 < 7)) - LET b6139 == (0 % -1) IN LET b6140 == b6139 IN 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
