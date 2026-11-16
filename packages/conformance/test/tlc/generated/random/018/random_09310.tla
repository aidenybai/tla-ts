(*---
description: Evaluates a random function expression, seed 262, number 9310.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09310 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Append(SelectSeq(<<>>, LAMBDA e : e > 0), (CHOOSE b14447 \in SUBSET {1} : TRUE)) \subseteq (Cardinality(Nat) .. (7 % 2))) EXCEPT ![(Len(<<2147483647, 2147483647>>) \div IF (TRUE <=> FALSE) THEN (7 - 2) ELSE (0 * 1))] = (-((CHOOSE b14448 \in {} : <<5, 6>>) + (--1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 279 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 276.
    | ExtendableExpr starting at line 14, column 240.
    | Expression starting at line 14, column 240.
    | ExtendableExpr starting at line 14, column 239.
    | Expression starting at line 14, column 238.
    | Fatal errors while parsing TLA+ spec in file random_09310
    | In module random_09310
    | Could not parse module random_09310 from file random_09310.tla
    | *** Errors: 1
    | In module random_09310
    | Could not parse module random_09310 from file random_09310.tla
    3002:1 Parsing or semantic analysis failed.
---*)
