(*---
description: to_string applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "<<2>>"'
---*)
