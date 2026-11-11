(*---
description: Evaluates a random record expression, seed 262, number 2334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), b |-> (\A b3696 \in UNION {2..1, {}} : (~TRUE))] EXCEPT !.a = ([b3697 \in ({x \in 1..3 : x > 1} \ {}) |-> ((1 :> 2))[0]])[(-Len(<<1>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02334 failed.
    In applying the function
    [b3697 \in {2, 3} |-> <expression line 14, col 175 to line 14, col 187 of module random_02334>],
    the first argument is:
    -1
    which is not in its domain.
---*)
