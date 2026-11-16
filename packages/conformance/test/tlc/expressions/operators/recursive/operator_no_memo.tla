(*---
description: "A recursive operator has no memoization, so repeated subcalls rerun."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE operator_no_memo ----
EXTENDS Integers, TLC
RECURSIVE Fib(_)
Fib(n) == IF PrintT(n) /\ n < 2 THEN n ELSE Fib(n - 1) + Fib(n - 2)
Test == Fib(3) = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 3
    | 2
    | 1
    | 0
    | 1
---*)
