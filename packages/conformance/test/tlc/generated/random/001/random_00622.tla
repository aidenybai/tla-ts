(*---
description: Evaluates a random bool expression, seed 262, number 622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(-CASE FALSE -> 7 [] OTHER -> 1), (Len(<<1, 2>>) * Head(<<3, 1, 2>>))>> => (~({b1043 \in <<1>> : TRUE} <=> (FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00622 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 17 to line 14, col 142 of module random_00622
---*)
