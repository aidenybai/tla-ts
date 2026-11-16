(*---
description: Evaluates a random seq expression, seed 262, number 4982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ([b7755 \in 2..1 |-> 2147483647] = (TRUE :> 2147483647)) -> Cardinality(UNION {{}, 2..1}) [] OTHER -> ((-2) \div (7 - 2147483647)), (Tail(((1 :> 2) @@ [x \in 1..2 |-> x]))).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04982 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
