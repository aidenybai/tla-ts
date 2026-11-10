(*---
description: Evaluates a random seq expression, seed 262, number 7052.
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
    exit: 0
    transcript: '| <<0, FALSE>>'
---*)
---- MODULE random_07052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b10818 == ([b10819 \in SUBSET {1} |-> 1..3])[(2147483647 + 7)] IN Cardinality((2 .. 1)), (\A b10820 \in (([x \in 1..2 |-> x])[1] .. CASE FALSE -> 3 [] OTHER -> 2147483647) : (Cardinality({}) \in ({1, 2} \ 1..3)))>>)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
