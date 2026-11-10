(*---
description: Evaluates a random set expression, seed 262, number 1611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([(7 :> 1) EXCEPT ![(2 * 1)] = CASE FALSE -> 7 [] OTHER -> -1] @@ [[(1 :> 2) EXCEPT ![7] = 0] EXCEPT ![Head(<<>>)] = (--1)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 143 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 140.
    | Expression starting at line 14, column 140.
    | Except Spec starting at line 14, column 124.
    | Some [] Form starting at line 14, column 89.
    | ExtendableExpr starting at line 14, column 89.
    | Fatal errors while parsing TLA+ spec in file random_01611
    | In module random_01611
    | Could not parse module random_01611 from file random_01611.tla
    | *** Errors: 1
    | In module random_01611
    | Could not parse module random_01611 from file random_01611.tla
    3002:1 Parsing or semantic analysis failed.
---*)
