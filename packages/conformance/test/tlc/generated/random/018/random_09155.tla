(*---
description: Evaluates a random int expression, seed 262, number 9155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq(SelectSeq(<<2, 7>>, LAMBDA e : e > 0), Cardinality(({2, 1, 3} \cap FALSE)), ((1 :> 0))[(--1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 117 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 114.
    | Expression starting at line 14, column 114.
    | Some [] Form starting at line 14, column 113.
    | ExtendableExpr starting at line 14, column 103.
    | Expression starting at line 14, column 103.
    | Fatal errors while parsing TLA+ spec in file random_09155
    | In module random_09155
    | Could not parse module random_09155 from file random_09155.tla
    | *** Errors: 1
    | In module random_09155
    | Could not parse module random_09155 from file random_09155.tla
    3002:1 Parsing or semantic analysis failed.
---*)
