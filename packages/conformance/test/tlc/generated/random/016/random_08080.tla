(*---
description: Evaluates a random bool expression, seed 262, number 8080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12489 \in {Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) : b12490 \in DOMAIN [<<5, 6>> EXCEPT ![1] = 7]} : (({b12491 \in Nat : TRUE} \cup (2 .. 7)) = {(b12492 + 3) : b12492 \in (2147483647 .. 2147483647)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08080 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
