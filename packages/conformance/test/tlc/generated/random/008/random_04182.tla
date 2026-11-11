(*---
description: Evaluates a random seq expression, seed 262, number 4182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail((SortSeq(3, LAMBDA p, q : p < q) \o SortSeq(<<1>>, LAMBDA p, q : p < q))) EXCEPT ![1] = ((-Head(<<1, 2>>)) * IF (~{1, 2}) THEN (--1) ELSE [<<5, 6>> EXCEPT ![3] = 2])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 152 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 149.
    | Expression starting at line 14, column 149.
    | IF THEN ELSE starting at line 14, column 131.
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | Fatal errors while parsing TLA+ spec in file random_04182
    | In module random_04182
    | Could not parse module random_04182 from file random_04182.tla
    | *** Errors: 1
    | In module random_04182
    | Could not parse module random_04182 from file random_04182.tla
    3002:1 Parsing or semantic analysis failed.
---*)
