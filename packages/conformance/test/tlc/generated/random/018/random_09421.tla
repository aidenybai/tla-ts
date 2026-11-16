(*---
description: Evaluates a random seq expression, seed 262, number 9421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SelectSeq((<<1>> \o <<3, 1, 2>>), LAMBDA e : e > 0), CASE (~TRUE) -> Head(<<3, 1, 2>>) [] OTHER -> (CHOOSE b14613 \in {1, 2} : TRUE), ((-1) * Head(<<1, 2>>))) \o <<([<<5, 6>> EXCEPT ![7] = 3])[(7 % 1)], [Append(<<1>>, 2) EXCEPT ![1] = (FALSE - 2)]>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 190 to line 14, col 197 of module random_09421
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09421 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
