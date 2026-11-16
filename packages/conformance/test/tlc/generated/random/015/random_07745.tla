(*---
description: Evaluates a random record expression, seed 262, number 7745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), Cardinality(Nat), (--1))), b |-> (((2147483647 \div 2) < (CHOOSE b11949 \in {2, 1, 3} : FALSE)) /\ (({1, 2} \ SUBSET {1}) \subseteq (SUBSET {1} \cap Nat)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 91 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 88.
    | Expression starting at line 14, column 88.
    | Optional Arguments starting at line 14, column 33.
    | Primitive expression starting at line 14, column 27.
    | ExtendableExpr starting at line 14, column 27.
    | Fatal errors while parsing TLA+ spec in file random_07745
    | In module random_07745
    | Could not parse module random_07745 from file random_07745.tla
    | *** Errors: 1
    | In module random_07745
    | Could not parse module random_07745 from file random_07745.tla
    3002:1 Parsing or semantic analysis failed.
---*)
