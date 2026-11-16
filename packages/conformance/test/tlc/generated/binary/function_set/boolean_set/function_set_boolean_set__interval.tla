(*---
description: function_set of boolean_set, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (FALSE :> 1 @@ TRUE :> 1),
    |   (FALSE :> 1 @@ TRUE :> 2),
    |   (FALSE :> 1 @@ TRUE :> 3),
    |   (FALSE :> 2 @@ TRUE :> 1),
    |   (FALSE :> 2 @@ TRUE :> 2),
    |   (FALSE :> 2 @@ TRUE :> 3),
    |   (FALSE :> 3 @@ TRUE :> 1),
    |   (FALSE :> 3 @@ TRUE :> 2),
    |   (FALSE :> 3 @@ TRUE :> 3) }
---*)
