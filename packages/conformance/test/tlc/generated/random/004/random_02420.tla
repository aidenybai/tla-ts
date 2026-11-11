(*---
description: Evaluates a random function expression, seed 262, number 2420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 24, col 8 to line 24, col 11 of module random_02420 failed.
      Attempted to apply function:
      (-1 :> -7)
      to argument 1, which is not in the domain of the function.
---*)
---- MODULE random_02420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append((<<>> \o <<1, 2>>), (0 * 3))) :> ((LET b3821 == -1 IN b3821 :> (-7)))[(CHOOSE b3822 \in (1 .. 2147483647) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))]))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
