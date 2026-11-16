(*---
description: colon_greater of string_a, a StringValue, and model_value, a ModelValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE colon_greater_string_a__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(("a") :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> mv]"
---*)
