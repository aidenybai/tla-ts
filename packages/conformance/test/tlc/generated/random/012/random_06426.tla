(*---
description: Evaluates a random seq expression, seed 262, number 6426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0), (-(7 + 0))), (Head((<<1>> \o <<>>)) % (CHOOSE b9892 \in DOMAIN [x \in 1..2 |-> x] : ({2, 1, 3} \ {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 133 to line 14, col 200 of module random_06426
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 133 to line 14, col 200 of module random_06426
---*)
