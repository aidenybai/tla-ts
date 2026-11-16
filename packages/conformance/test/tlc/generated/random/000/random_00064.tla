(*---
description: Evaluates a random seq expression, seed 262, number 64.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(((<<2, -1>> \o (<<1>> - 2)) \o SubSeq((<<1>> \o <<3, 1, 2>>), Cardinality(SUBSET {1}), (--1))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 114 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | Optional Arguments starting at line 14, column 61.
    | Primitive expression starting at line 14, column 55.
    | ExtendableExpr starting at line 14, column 55.
    | Fatal errors while parsing TLA+ spec in file random_00064
    | In module random_00064
    | Could not parse module random_00064 from file random_00064.tla
    | *** Errors: 1
    | In module random_00064
    | Could not parse module random_00064 from file random_00064.tla
    3002:1 Parsing or semantic analysis failed.
---*)
