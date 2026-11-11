(*---
description: plus_left applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_left_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 :> 2 + 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3>>"
---*)
