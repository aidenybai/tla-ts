(*---
description: Evaluates a random function expression, seed 262, number 121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq((<<>> \o <<>>), (7 % 7), CASE FALSE -> -1 [] OTHER -> 1)) + (Head(SelectSeq(<<>>, LAMBDA e : e > 0)) + ((CHOOSE b187 \in SUBSET {1} : TRUE) * (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 174 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 171.
    | ExtendableExpr starting at line 14, column 133.
    | Expression starting at line 14, column 133.
    | ExtendableExpr starting at line 14, column 132.
    | ExtendableExpr starting at line 14, column 90.
    | Fatal errors while parsing TLA+ spec in file random_00121
    | In module random_00121
    | Could not parse module random_00121 from file random_00121.tla
    | *** Errors: 1
    | In module random_00121
    | Could not parse module random_00121 from file random_00121.tla
    3002:1 Parsing or semantic analysis failed.
---*)
