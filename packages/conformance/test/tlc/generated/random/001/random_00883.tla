(*---
description: Evaluates a random int expression, seed 262, number 883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1427 \in (CASE -1 -> 2147483647 [] OTHER -> 2147483647 .. Cardinality(1..3)) : (LET b1428 == 0 IN b1427 < (7 * b1427))) * Head([(<<>> \o <<1, 2>>) EXCEPT ![1] = (--1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 190 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 187.
    | Expression starting at line 14, column 187.
    | Except Spec starting at line 14, column 180.
    | Some [] Form starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 153.
    | Fatal errors while parsing TLA+ spec in file random_00883
    | In module random_00883
    | Could not parse module random_00883 from file random_00883.tla
    | *** Errors: 1
    | In module random_00883
    | Could not parse module random_00883 from file random_00883.tla
    3002:1 Parsing or semantic analysis failed.
---*)
